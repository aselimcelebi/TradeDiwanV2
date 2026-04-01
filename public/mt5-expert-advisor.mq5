//+------------------------------------------------------------------+
//|                                           TradeJournalConnector.mq5 |
//|                                  Copyright 2024, Trade Journal App |
//|                                             https://localhost:3001 |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Trade Journal App"
#property link      "https://localhost:3001"
#property version   "1.00"

//--- includes
#include <Trade\Trade.mqh>

//--- input parameters
input string    WebSocketHost = "localhost";     // WebSocket Host
input int       WebSocketPort = 8080;           // WebSocket Port
input bool      AutoExport = true;              // Auto Export Closed Trades
input bool      ExportOnStart = true;           // Export History on Start
input int       HistoryDays = 30;               // History Days to Export

//--- global variables
int websocket_handle = INVALID_HANDLE;
datetime last_check_time = 0;
bool is_connected = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Trade Journal Connector EA Started");
   
   //--- create websocket server
   if(!CreateWebSocketServer())
   {
      Print("Failed to create WebSocket server");
      return INIT_FAILED;
   }
   
   //--- export existing history if enabled
   if(ExportOnStart)
   {
      ExportTradeHistory();
   }
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(websocket_handle != INVALID_HANDLE)
   {
      //--- close websocket connection
      //SocketClose(websocket_handle);
      Print("Trade Journal Connector EA Stopped");
   }
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   //--- check for new closed trades every 5 seconds
   if(TimeCurrent() - last_check_time >= 5)
   {
      if(AutoExport)
      {
         CheckForNewClosedTrades();
      }
      last_check_time = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Create WebSocket Server                                          |
//+------------------------------------------------------------------+
bool CreateWebSocketServer()
{
   // Note: MQL5 doesn't have built-in WebSocket server support
   // This is a placeholder for the connection logic
   // In real implementation, you would:
   // 1. Use a DLL to create WebSocket server
   // 2. Or use HTTP requests to send data
   // 3. Or use file-based communication
   
   Print("WebSocket server simulation started on ", WebSocketHost, ":", WebSocketPort);
   is_connected = true;
   
   //--- send account info
   SendAccountInfo();
   
   return true;
}

//+------------------------------------------------------------------+
//| Send Account Information                                          |
//+------------------------------------------------------------------+
void SendAccountInfo()
{
   //--- prepare account info
   string account_data = StringFormat(
      "{"
      "\"type\":\"account_info\","
      "\"payload\":{"
      "\"login\":%d,"
      "\"server\":\"%s\","
      "\"name\":\"%s\","
      "\"company\":\"%s\","
      "\"currency\":\"%s\","
      "\"balance\":%.2f,"
      "\"equity\":%.2f,"
      "\"margin\":%.2f,"
      "\"free_margin\":%.2f"
      "}"
      "}",
      AccountInfoInteger(ACCOUNT_LOGIN),
      AccountInfoString(ACCOUNT_SERVER),
      AccountInfoString(ACCOUNT_NAME),
      AccountInfoString(ACCOUNT_COMPANY),
      AccountInfoString(ACCOUNT_CURRENCY),
      AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY),
      AccountInfoDouble(ACCOUNT_MARGIN),
      AccountInfoDouble(ACCOUNT_FREEMARGIN)
   );
   
   //--- send via websocket (placeholder)
   SendWebSocketMessage(account_data);
}

//+------------------------------------------------------------------+
//| Export Trade History                                             |
//+------------------------------------------------------------------+
void ExportTradeHistory()
{
   Print("Exporting trade history for last ", HistoryDays, " days");
   
   //--- set history period
   datetime from = TimeCurrent() - HistoryDays * 24 * 60 * 60;
   datetime to = TimeCurrent();
   
   if(!HistorySelect(from, to))
   {
      Print("Failed to select history");
      return;
   }
   
   //--- get total deals
   int total = HistoryDealsTotal();
   Print("Found ", total, " deals in history");
   
   //--- process deals
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0)
      {
         //--- get deal properties
         if(HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_BUY || 
            HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_SELL)
         {
            if(HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT)
            {
               //--- this is a closing deal, export it
               ExportClosedTrade(ticket);
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Check for New Closed Trades                                     |
//+------------------------------------------------------------------+
void CheckForNewClosedTrades()
{
   //--- get recent history
   datetime from = TimeCurrent() - 60; // last minute
   datetime to = TimeCurrent();
   
   if(!HistorySelect(from, to))
      return;
      
   int total = HistoryDealsTotal();
   
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0)
      {
         if(HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT)
         {
            //--- new closed trade found
            ExportClosedTrade(ticket);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Export Closed Trade                                             |
//+------------------------------------------------------------------+
void ExportClosedTrade(ulong ticket)
{
   //--- get deal info
   string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
   double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
   double price = HistoryDealGetDouble(ticket, DEAL_PRICE);
   datetime time = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
   double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
   double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
   double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
   string comment = HistoryDealGetString(ticket, DEAL_COMMENT);
   long type = HistoryDealGetInteger(ticket, DEAL_TYPE);
   
   //--- find opening deal
   ulong position_id = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
   double open_price = 0;
   datetime open_time = 0;
   
   //--- search for opening deal
   int history_total = HistoryDealsTotal();
   for(int i = 0; i < history_total; i++)
   {
      ulong temp_ticket = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(temp_ticket, DEAL_POSITION_ID) == position_id &&
         HistoryDealGetInteger(temp_ticket, DEAL_ENTRY) == DEAL_ENTRY_IN)
      {
         open_price = HistoryDealGetDouble(temp_ticket, DEAL_PRICE);
         open_time = (datetime)HistoryDealGetInteger(temp_ticket, DEAL_TIME);
         break;
      }
   }
   
   //--- prepare trade data
   string trade_data = StringFormat(
      "{"
      "\"type\":\"trade_closed\","
      "\"payload\":{"
      "\"ticket\":%d,"
      "\"symbol\":\"%s\","
      "\"type\":%d,"
      "\"volume\":%.2f,"
      "\"price_open\":%.5f,"
      "\"price_close\":%.5f,"
      "\"time_open\":%d,"
      "\"time_close\":%d,"
      "\"profit\":%.2f,"
      "\"commission\":%.2f,"
      "\"swap\":%.2f,"
      "\"comment\":\"%s\""
      "}"
      "}",
      ticket,
      symbol,
      type,
      volume,
      open_price,
      price,
      open_time,
      time,
      profit,
      commission,
      swap,
      comment
   );
   
   //--- send trade data
   SendWebSocketMessage(trade_data);
   
   Print("Exported trade: ", ticket, " ", symbol, " ", volume, " lots");
}

//+------------------------------------------------------------------+
//| Send WebSocket Message                                           |
//+------------------------------------------------------------------+
void SendWebSocketMessage(string message)
{
   // In real implementation, this would send via WebSocket
   // For now, we'll use HTTP POST or file writing
   
   //--- alternative: write to file for Node.js to read
   string filename = "trade_journal_export.json";
   int file_handle = FileOpen(filename, FILE_WRITE|FILE_TXT|FILE_ANSI);
   
   if(file_handle != INVALID_HANDLE)
   {
      FileWrite(file_handle, message);
      FileClose(file_handle);
   }
   
   //--- alternative: HTTP POST request
   SendHTTPRequest(message);
}

//+------------------------------------------------------------------+
//| Send HTTP Request                                                |
//+------------------------------------------------------------------+
void SendHTTPRequest(string data)
{
   string url = "http://localhost:3001/api/mt5/import";
   string headers = "Content-Type: application/json\r\n";
   
   //--- prepare request
   char post_data[];
   StringToCharArray(data, post_data, 0, StringLen(data));
   
   //--- send request (placeholder - requires HTTP library)
   Print("Sending HTTP request: ", StringSubstr(data, 0, 100), "...");
}

//+------------------------------------------------------------------+
