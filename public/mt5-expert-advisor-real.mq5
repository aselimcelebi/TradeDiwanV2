//+------------------------------------------------------------------+
//| MT5 Trade Journal Expert Advisor - Real Implementation          |
//| Copyright 2024, Trade Journal App                                |
//| Professional-grade real-time trade synchronization              |
//+------------------------------------------------------------------+

#property copyright "Trade Journal App"
#property link      "https://tradediwan.com"
#property version   "4.0"
#property description "Real-time MT5 trade synchronization with advanced features"
#property strict

//--- Input parameters
input group "=== Connection Settings ==="
input string WebhookURL = "https://tradediwan.com/api/mt5/import";    // Web application endpoint
input string ApiKey = "";                                            // API key for authentication
input bool UseSSL = true;                                           // Use HTTPS connection

input group "=== Sync Settings ==="
input bool EnableRealTimeSync = true;                               // Enable real-time synchronization
input bool ExportOnStart = true;                                    // Export history on EA start
input int HistoryDays = 30;                                         // Days of history to export
input int SyncIntervalSeconds = 5;                                  // Sync check interval

input group "=== Filter Settings ==="
input bool SyncClosedTradesOnly = true;                            // Only sync closed trades
input bool SyncOpenPositions = false;                              // Sync open positions
input bool SyncPendingOrders = false;                              // Sync pending orders
input string SymbolFilter = "";                                    // Filter by symbol (empty = all)

input group "=== Advanced Settings ==="
input bool EnableRetry = true;                                     // Retry failed requests
input int MaxRetries = 3;                                          // Maximum retry attempts
input bool EnableLogging = true;                                   // Enable detailed logging
input bool SendHeartbeat = true;                                   // Send periodic heartbeat

//--- Global variables
datetime lastSyncTime = 0;
datetime lastHeartbeat = 0;
string appId;
bool isConnected = false;
int failedAttempts = 0;

//--- Structures
struct TradeData
{
    ulong ticket;
    string symbol;
    int type;
    double volume;
    double openPrice;
    double closePrice;
    datetime openTime;
    datetime closeTime;
    double profit;
    double commission;
    double swap;
    double fee;
    string comment;
    ulong positionId;
    int magicNumber;
};

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    // Generate unique app ID
    appId = "TradeJournalMT5_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "_" + IntegerToString(GetTickCount());
    
    Print("=== Trade Journal EA v3.0 Initialized ===");
    Print("Account: ", AccountInfoInteger(ACCOUNT_LOGIN));
    Print("Server: ", AccountInfoString(ACCOUNT_SERVER));
    Print("App ID: ", appId);
    Print("Webhook URL: ", WebhookURL);
    
    // Test connection
    if(!TestConnection())
    {
        Print("Warning: Could not establish connection to web application");
        return(INIT_SUCCEEDED); // Continue anyway
    }
    
    isConnected = true;
    
    // Send initial account info
    SendAccountInfo();
    
    // Export existing history if requested
    if(ExportOnStart)
    {
        Print("Starting historical trade export...");
        ExportTradeHistory();
    }
    
    // Initialize last sync time
    lastSyncTime = TimeCurrent() - 60; // Start from 1 minute ago
    lastHeartbeat = TimeCurrent();
    
    Print("=== Trade Journal EA Ready ===");
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    Print("=== Trade Journal EA Stopped ===");
    Print("Reason: ", reason);
    
    // Send disconnect notification
    SendDisconnectNotification();
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
    if(!EnableRealTimeSync) return;
    
    static datetime lastCheck = 0;
    datetime currentTime = TimeCurrent();
    
    // Check for new trades based on interval
    if(currentTime - lastCheck >= SyncIntervalSeconds)
    {
        lastCheck = currentTime;
        CheckForNewTrades();
        
        // Send heartbeat every 5 minutes
        if(SendHeartbeat && (currentTime - lastHeartbeat) >= 300)
        {
            SendHeartbeatPing();
            lastHeartbeat = currentTime;
        }
    }
}

//+------------------------------------------------------------------+
//| Trade transaction function - Real-time trade detection          |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                       const MqlTradeRequest &request,
                       const MqlTradeResult &result)
{
    if(!EnableRealTimeSync) return;
    
    // Handle different transaction types
    switch(trans.type)
    {
        case TRADE_TRANSACTION_DEAL_ADD:
            if(SyncClosedTradesOnly)
            {
                HandleDealAdd(trans.deal);
            }
            break;
            
        case TRADE_TRANSACTION_POSITION:
            if(SyncOpenPositions)
            {
                HandlePositionChange(trans.position);
            }
            break;
            
        case TRADE_TRANSACTION_ORDER_ADD:
        case TRADE_TRANSACTION_ORDER_UPDATE:
        case TRADE_TRANSACTION_ORDER_DELETE:
            if(SyncPendingOrders)
            {
                HandleOrderChange(trans.order);
            }
            break;
    }
}

//+------------------------------------------------------------------+
//| Handle deal addition                                             |
//+------------------------------------------------------------------+
void HandleDealAdd(ulong dealTicket)
{
    if(!HistoryDealSelect(dealTicket))
    {
        if(EnableLogging) Print("Could not select deal: ", dealTicket);
        return;
    }
    
    string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
    ENUM_DEAL_TYPE dealType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(dealTicket, DEAL_TYPE);
    ENUM_DEAL_ENTRY dealEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
    
    // Filter by symbol if specified
    if(SymbolFilter != "" && symbol != SymbolFilter) return;
    
    // Only process buy/sell deals that close positions
    if((dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) || dealEntry != DEAL_ENTRY_OUT) 
        return;
    
    if(EnableLogging) Print("Processing closed position deal: ", dealTicket, " Symbol: ", symbol);
    
    // Get complete trade data for the position
    ulong positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
    TradeData trade;
    if(GetCompleteTradeData(positionId, trade))
    {
        SendTradeData(trade);
    }
}

//+------------------------------------------------------------------+
//| Get complete trade data from position                           |
//+------------------------------------------------------------------+
bool GetCompleteTradeData(ulong positionId, TradeData &trade)
{
    if(!HistorySelectByPosition(positionId))
    {
        return false;
    }
    
    double entryPrice = 0, exitPrice = 0, totalVolume = 0;
    datetime entryTime = 0, exitTime = 0;
    double totalProfit = 0, totalCommission = 0, totalSwap = 0, totalFee = 0;
    string symbol = "";
    int tradeType = -1;
    string comment = "";
    
    int totalDeals = HistoryDealsTotal();
    
    for(int i = 0; i < totalDeals; i++)
    {
        ulong ticket = HistoryDealGetTicket(i);
        if(HistoryDealGetInteger(ticket, DEAL_POSITION_ID) == positionId)
        {
            ENUM_DEAL_ENTRY dealEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
            
            if(dealEntry == DEAL_ENTRY_IN)
            {
                entryPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
                entryTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
                totalVolume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
                symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
                tradeType = (int)HistoryDealGetInteger(ticket, DEAL_TYPE);
                comment = HistoryDealGetString(ticket, DEAL_COMMENT);
            }
            else if(dealEntry == DEAL_ENTRY_OUT)
            {
                exitPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
                exitTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
            }
            
            totalProfit += HistoryDealGetDouble(ticket, DEAL_PROFIT);
            totalCommission += HistoryDealGetDouble(ticket, DEAL_COMMISSION);
            totalSwap += HistoryDealGetDouble(ticket, DEAL_SWAP);
            totalFee += HistoryDealGetDouble(ticket, DEAL_FEE);
        }
    }
    
    if(entryPrice > 0 && exitPrice > 0)
    {
        trade.ticket = positionId;
        trade.symbol = symbol;
        trade.type = tradeType;
        trade.volume = totalVolume;
        trade.openPrice = entryPrice;
        trade.closePrice = exitPrice;
        trade.openTime = entryTime;
        trade.closeTime = exitTime;
        trade.profit = totalProfit;
        trade.commission = totalCommission;
        trade.swap = totalSwap;
        trade.fee = totalFee;
        trade.comment = comment;
        trade.positionId = positionId;
        
        return true;
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Send trade data to web application                              |
//+------------------------------------------------------------------+
bool SendTradeData(const TradeData &trade)
{
    string json = CreateTradeJSON(trade);
    return SendHTTPRequest(json, "trade");
}

//+------------------------------------------------------------------+
//| Create JSON for trade data                                      |
//+------------------------------------------------------------------+
string CreateTradeJSON(const TradeData &trade)
{
    string json = "{";
    json += "\"type\":\"trade\",";
    json += "\"appId\":\"" + appId + "\",";
    json += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    json += "\"account\":{";
    json += "\"login\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + ",";
    json += "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\"";
    json += "},";
    json += "\"trade\":{";
    json += "\"ticket\":" + IntegerToString(trade.ticket) + ",";
    json += "\"symbol\":\"" + trade.symbol + "\",";
    json += "\"type\":" + IntegerToString(trade.type) + ",";
    json += "\"volume\":" + DoubleToString(trade.volume, 2) + ",";
    json += "\"openPrice\":" + DoubleToString(trade.openPrice, 5) + ",";
    json += "\"closePrice\":" + DoubleToString(trade.closePrice, 5) + ",";
    json += "\"openTime\":" + IntegerToString(trade.openTime) + ",";
    json += "\"closeTime\":" + IntegerToString(trade.closeTime) + ",";
    json += "\"profit\":" + DoubleToString(trade.profit, 2) + ",";
    json += "\"commission\":" + DoubleToString(trade.commission, 2) + ",";
    json += "\"swap\":" + DoubleToString(trade.swap, 2) + ",";
    json += "\"fee\":" + DoubleToString(trade.fee, 2) + ",";
    json += "\"comment\":\"" + trade.comment + "\",";
    json += "\"positionId\":" + IntegerToString(trade.positionId) + ",";
    json += "\"magicNumber\":" + IntegerToString(trade.magicNumber);
    json += "}";
    json += "}";
    
    return json;
}

//+------------------------------------------------------------------+
//| Export trade history                                             |
//+------------------------------------------------------------------+
void ExportTradeHistory()
{
    datetime fromDate = TimeCurrent() - (HistoryDays * 86400);
    
    if(!HistorySelect(fromDate, TimeCurrent()))
    {
        Print("Failed to select history for period");
        return;
    }
    
    Print("Exporting trade history for last ", HistoryDays, " days...");
    
    // Process all closed positions
    int exportedTrades = 0;
    
    // Get unique position IDs
    for(int i = HistoryDealsTotal() - 1; i >= 0; i--)
    {
        ulong dealTicket = HistoryDealGetTicket(i);
        if(dealTicket > 0)
        {
            ENUM_DEAL_ENTRY dealEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
            
            // Only process position closing deals
            if(dealEntry == DEAL_ENTRY_OUT)
            {
                ulong positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
                TradeData trade;
                
                if(GetCompleteTradeData(positionId, trade))
                {
                    // Filter by symbol if specified
                    if(SymbolFilter != "" && trade.symbol != SymbolFilter) continue;
                    
                    if(SendTradeData(trade))
                    {
                        exportedTrades++;
                    }
                    Sleep(100); // Small delay to avoid overwhelming the server
                }
            }
        }
    }
    
    Print("Trade history export completed. Exported trades: ", exportedTrades);
}

//+------------------------------------------------------------------+
//| Send account information                                         |
//+------------------------------------------------------------------+
bool SendAccountInfo()
{
    string json = "{";
    json += "\"type\":\"account\",";
    json += "\"appId\":\"" + appId + "\",";
    json += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    json += "\"account\":{";
    json += "\"login\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + ",";
    json += "\"name\":\"" + AccountInfoString(ACCOUNT_NAME) + "\",";
    json += "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\",";
    json += "\"currency\":\"" + AccountInfoString(ACCOUNT_CURRENCY) + "\",";
    json += "\"company\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",";
    json += "\"leverage\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LEVERAGE)) + ",";
    json += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
    json += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
    json += "\"margin\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN), 2) + ",";
    json += "\"freeMargin\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2) + ",";
    json += "\"marginLevel\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_LEVEL), 2) + ",";
    json += "\"credit\":" + DoubleToString(AccountInfoDouble(ACCOUNT_CREDIT), 2);
    json += "}";
    json += "}";
    
    return SendHTTPRequest(json, "account");
}

//+------------------------------------------------------------------+
//| Check for new trades                                             |
//+------------------------------------------------------------------+
void CheckForNewTrades()
{
    datetime currentTime = TimeCurrent();
    
    // Check for new deals since last sync
    if(!HistorySelect(lastSyncTime, currentTime)) return;
    
    int totalDeals = HistoryDealsTotal();
    for(int i = 0; i < totalDeals; i++)
    {
        ulong dealTicket = HistoryDealGetTicket(i);
        if(dealTicket > 0)
        {
            datetime dealTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
            if(dealTime > lastSyncTime)
            {
                HandleDealAdd(dealTicket);
                lastSyncTime = dealTime;
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Test connection to web application                              |
//+------------------------------------------------------------------+
bool TestConnection()
{
    string json = "{";
    json += "\"type\":\"ping\",";
    json += "\"appId\":\"" + appId + "\",";
    json += "\"timestamp\":" + IntegerToString(TimeCurrent());
    json += "}";
    
    return SendHTTPRequest(json, "ping");
}

//+------------------------------------------------------------------+
//| Send heartbeat ping                                              |
//+------------------------------------------------------------------+
void SendHeartbeatPing()
{
    string json = "{";
    json += "\"type\":\"heartbeat\",";
    json += "\"appId\":\"" + appId + "\",";
    json += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    json += "\"status\":\"active\"";
    json += "}";
    
    SendHTTPRequest(json, "heartbeat");
}

//+------------------------------------------------------------------+
//| Send disconnect notification                                     |
//+------------------------------------------------------------------+
void SendDisconnectNotification()
{
    string json = "{";
    json += "\"type\":\"disconnect\",";
    json += "\"appId\":\"" + appId + "\",";
    json += "\"timestamp\":" + IntegerToString(TimeCurrent());
    json += "}";
    
    SendHTTPRequest(json, "disconnect");
}

//+------------------------------------------------------------------+
//| Send HTTP request to web application                            |
//+------------------------------------------------------------------+
bool SendHTTPRequest(string jsonData, string requestType = "")
{
    string headers = "Content-Type: application/json\r\n";
    if(ApiKey != "")
    {
        headers += "Authorization: Bearer " + ApiKey + "\r\n";
    }
    
    char data[];
    StringToCharArray(jsonData, data, 0, StringLen(jsonData));
    
    char result[];
    string responseHeaders;
    
    int timeout = 15000; // 15 seconds timeout
    string url = WebhookURL;
    
    // Debug logging
    if(EnableLogging)
    {
        Print("Sending ", requestType, " request to: ", url);
        Print("JSON Data: ", jsonData);
    }
    
    int response = WebRequest("POST", url, headers, timeout, data, result, responseHeaders);
    
    bool success = false;
    
    if(response == 200)
    {
        success = true;
        failedAttempts = 0;
        if(EnableLogging && requestType != "heartbeat") 
        {
            Print("✓ ", requestType, " data sent successfully");
        }
    }
    else if(response == -1)
    {
        int error = GetLastError();
        Print("✗ WebRequest error (", error, "). Check if URL is in allowed list: ", url);
        
        if(error == 4060) // URL not allowed
        {
            Print("Add this URL to Tools -> Options -> Expert Advisors -> Allow WebRequest for listed URL");
        }
    }
    else
    {
        Print("✗ HTTP request failed with code: ", response, " for ", requestType);
        
        // Try to parse error response
        string responseText = CharArrayToString(result);
        if(StringLen(responseText) > 0)
        {
            Print("Response: ", responseText);
        }
    }
    
    // Handle retry logic
    if(!success && EnableRetry && failedAttempts < MaxRetries)
    {
        failedAttempts++;
        Print("Retrying request... Attempt: ", failedAttempts, "/", MaxRetries);
        Sleep(1000 * failedAttempts); // Exponential backoff
        return SendHTTPRequest(jsonData, requestType + "_retry");
    }
    
    return success;
}

//+------------------------------------------------------------------+
//| Handle position changes                                          |
//+------------------------------------------------------------------+
void HandlePositionChange(ulong positionTicket)
{
    if(EnableLogging) Print("Position changed: ", positionTicket);
}

//+------------------------------------------------------------------+
//| Handle order changes                                             |
//+------------------------------------------------------------------+
void HandleOrderChange(ulong orderTicket)
{
    if(EnableLogging) Print("Order changed: ", orderTicket);
}
