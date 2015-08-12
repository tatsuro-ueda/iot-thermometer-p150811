function myFunction() {
  var response = UrlFetchApp.fetch(
    "https://cloudbit-webapi-p150705.herokuapp.com/input?" + 
    "CLOUDBIT_DEVICE_ID=" + env.deviceId +
    "&CLOUDBIT_ACCESS_TOKEN=" + env.accessToken);
  response = response.toString();
  var json = JSON.parse(response);
  Browser.msgBox(json.absolute/10);
}

function getPercent() {
  // 電圧（室温）を取得する
  var response = UrlFetchApp.fetch(
    "https://cloudbit-webapi-p150705.herokuapp.com/input?" + 
    "CLOUDBIT_DEVICE_ID=" + env.deviceId +
    "&CLOUDBIT_ACCESS_TOKEN=" + env.accessToken);
  var json = JSON.parse(response.toString());
  return json.absolute/10;
}  

function insertData() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastTemp = sheet.getRange(lastRow, 2).getValue();

  function mailedInTwoHours() {
    for (var i = 1; i <= 24; i++) {
      var value = sheet.getRange(lastRow - 24 + i, 3).getValue();
      if (value === 1) {
        return 1;
      }
    }
    return 0;
  }
  
  // 新しいデータを追記する
  var newTemp = getPercent();
  //var datetime = getDatetimeNowInFormat();
  var datetime = new Date();
  sheet.deleteRows(2, 1);  // 2行目を削除する
  sheet.appendRow([datetime, newTemp]);

  if (lastTemp < 33 && 33 <= newTemp) {
    if (mailedInTwoHours()) {
      return;
    } else {
      var MESSAGE = "寝室の気温が33°を超えました";
      GmailApp.sendEmail(env.email.tatsuro, MESSAGE, datetime);
      //GmailApp.sendEmail(env.email.nobue, MESSAGE, datetime);
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

