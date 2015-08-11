function myFunction() {
  var response = UrlFetchApp.fetch(
    "https://cloudbit-webapi-p150705.herokuapp.com/input?" + 
    "CLOUDBIT_DEVICE_ID=" + deviceId() +
    "&CLOUDBIT_ACCESS_TOKEN=" + accessToken());
  response = response.toString();
  var json = JSON.parse(response);
  Browser.msgBox(json.absolute/10);
}

function getPercent() {
  // 電圧（室温）を取得する
  var response = UrlFetchApp.fetch(
    "https://cloudbit-webapi-p150705.herokuapp.com/input?" + 
    "CLOUDBIT_DEVICE_ID=" + deviceId() +
    "&CLOUDBIT_ACCESS_TOKEN=" + accessToken());
  var json = JSON.parse(response.toString());
  return json.absolute/10;
}  

function insertData() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastTemp = sheet.getRange(lastRow, 2).getValue();

  // 新しいデータを追記する
  var newTemp = getPercent();
  //var datetime = getDatetimeNowInFormat();
  var datetime = new Date();
  sheet.deleteRows(2, 1);  // 2行目を削除する
  sheet.appendRow([datetime, newTemp]);

  if (lastTemp < 33.0 && 33.0 <= newTemp) {
    if (mailedInOneHour()) {
      return;
    } else {
      var MESSAGE = "寝室の気温が33°を超えました";
      GmailApp.sendEmail(emailTatsuro(), MESSAGE, datetime);
      GmailApp.sendEmail(emailNobue(), MESSAGE, datetime);
      sheet.getRange(lastRow, 3).setValue(1);
    }
  }
}

function getPercentDirectly() {
  var headers = 
      {
        "Accept" : "application/vnd.littlebits.v2+json",
        "Authorization" : "Bearer " + accessToken()
      };
  var params = {'headers' : headers};
  
  var response = UrlFetchApp.fetch(
    "https://api-http.littlebitscloud.cc/devices/" + deviceId() + "/input", params);
  response = response.toString();

  var json = JSON.parse(response);
  Browser.msgBox(
    //json.percent
    response
  );
}

function mailedInOneHour() {
  var sheet = SpreadsheetApp.getActiveSheet();
  for (var i = 1; i <= 12; i++) {
    var lastRow = sheet.getLastRow();
    var value = sheet.getRange(lastRow - 12 + i, 3).getValue();
    if (value === 1) {
      return 1;
    }
  }
  return 0;
}