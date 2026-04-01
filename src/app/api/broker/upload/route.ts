import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TradeZella style file upload endpoint for MT4/MT5 HTML reports
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const platform = formData.get('platform') as string;
    const userId = formData.get('userId') || 'demo';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Dosya seçilmedi' },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = ['.html', '.csv', '.xlsx'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz dosya formatı. HTML, CSV veya XLSX dosyası yükleyiniz.' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    let trades: any[] = [];

    // Parse different file formats
    switch (fileExtension) {
      case '.html':
        trades = parseMetaTraderHTML(fileContent, platform);
        break;
      case '.csv':
        trades = parseCSV(fileContent, platform);
        break;
      default:
        throw new Error('Desteklenmeyen dosya formatı');
    }

    // Save trades to database
    const savedTrades = [];
    for (const trade of trades) {
      const appTrade = {
        userId: userId as string,
        date: trade.closeTime,
        symbol: trade.symbol,
        side: trade.side,
        qty: trade.lots,
        entryPrice: trade.openPrice,
        exitPrice: trade.closePrice,
        fees: Math.abs(trade.commission || 0),
        notes: `${platform?.toUpperCase() || 'IMPORT'} ${trade.ticket ? `Ticket: ${trade.ticket}` : ''}${trade.comment ? ` - ${trade.comment}` : ''}`,
        strategy: `${platform?.toUpperCase() || 'IMPORT'} File Import`,
        tags: [`${platform?.toLowerCase() || 'import'}`, 'file-import'].join(','),
      };

      // Check for duplicates
      const existingTrade = await prisma.trade.findFirst({
        where: {
          userId: userId as string,
          symbol: trade.symbol,
          date: trade.closeTime,
          entryPrice: trade.openPrice,
          exitPrice: trade.closePrice,
        },
      });

      if (!existingTrade) {
        const savedTrade = await prisma.trade.create({
          data: appTrade,
        });
        savedTrades.push(savedTrade);
      }
    }

    return NextResponse.json({
      success: true,
      tradesImported: savedTrades.length,
      totalTrades: trades.length,
      duplicatesSkipped: trades.length - savedTrades.length,
      message: `${savedTrades.length} yeni işlem dosyadan içe aktarıldı`,
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Dosya yükleme başarısız' 
      },
      { status: 500 }
    );
  }
}

// Parse MetaTrader HTML report (similar to TradeZella method)
function parseMetaTraderHTML(html: string, platform: string) {
  const trades: any[] = [];

  try {
    // Simple HTML parsing for MT4/MT5 reports
    // In a real implementation, you'd use a proper HTML parser
    const rows = html.split('<tr>').slice(1); // Skip header

    for (const row of rows) {
      if (!row.includes('<td>')) continue;

      const cells = row.split('<td>').map(cell => 
        cell.split('</td>')[0].replace(/<[^>]*>/g, '').trim()
      ).filter(cell => cell);

      if (cells.length < 8) continue;

      try {
        const trade = {
          ticket: cells[0] || '',
          openTime: new Date(cells[1]),
          closeTime: new Date(cells[2]),
          symbol: cells[3] || '',
          type: cells[4]?.toLowerCase().includes('buy') ? 'LONG' : 'SHORT',
          side: cells[4]?.toLowerCase().includes('buy') ? 'LONG' : 'SHORT',
          lots: parseFloat(cells[5]) || 0,
          openPrice: parseFloat(cells[6]) || 0,
          closePrice: parseFloat(cells[7]) || 0,
          profit: parseFloat(cells[8]) || 0,
          commission: parseFloat(cells[9]) || 0,
          comment: cells[10] || '',
        };

        if (trade.symbol && trade.lots > 0 && trade.openPrice > 0 && trade.closePrice > 0) {
          trades.push(trade);
        }
      } catch (parseError) {
        console.warn('Error parsing trade row:', parseError);
        continue;
      }
    }
  } catch (error) {
    throw new Error('HTML dosyası parse edilemedi. Dosyanın MetaTrader HTML raporu olduğundan emin olun.');
  }

  return trades;
}

// Parse CSV file
function parseCSV(csv: string, platform: string) {
  const trades: any[] = [];
  
  try {
    const lines = csv.split('\n');
    const headers = lines[0]?.toLowerCase().split(',').map(h => h.trim());
    
    if (!headers || headers.length < 5) {
      throw new Error('Geçersiz CSV formatı');
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      if (values.length < headers.length) continue;

      try {
        const trade: any = {};
        
        // Map common CSV columns
        headers.forEach((header, index) => {
          const value = values[index];
          
          switch (header) {
            case 'ticket':
            case 'order':
            case 'id':
              trade.ticket = value;
              break;
            case 'symbol':
            case 'instrument':
              trade.symbol = value;
              break;
            case 'type':
            case 'side':
              trade.side = value?.toLowerCase().includes('buy') || value?.toLowerCase().includes('long') ? 'LONG' : 'SHORT';
              break;
            case 'volume':
            case 'lots':
            case 'size':
              trade.lots = parseFloat(value) || 0;
              break;
            case 'open price':
            case 'entry price':
            case 'price':
              trade.openPrice = parseFloat(value) || 0;
              break;
            case 'close price':
            case 'exit price':
              trade.closePrice = parseFloat(value) || 0;
              break;
            case 'open time':
            case 'entry time':
              trade.openTime = new Date(value);
              break;
            case 'close time':
            case 'exit time':
              trade.closeTime = new Date(value);
              break;
            case 'profit':
            case 'pnl':
              trade.profit = parseFloat(value) || 0;
              break;
            case 'commission':
            case 'fee':
              trade.commission = parseFloat(value) || 0;
              break;
            case 'comment':
            case 'note':
              trade.comment = value;
              break;
          }
        });

        // Validate required fields
        if (trade.symbol && trade.lots > 0 && trade.openPrice > 0 && trade.closePrice > 0) {
          if (!trade.closeTime) trade.closeTime = new Date();
          if (!trade.openTime) trade.openTime = new Date(trade.closeTime.getTime() - 60000);
          
          trades.push(trade);
        }
      } catch (parseError) {
        console.warn('Error parsing CSV row:', parseError);
        continue;
      }
    }
  } catch (error) {
    throw new Error('CSV dosyası parse edilemedi. Dosya formatını kontrol edin.');
  }

  return trades;
}
