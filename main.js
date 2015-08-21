HOURS = 4;
ALERT_TEMP = 30;

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

  function mailedInLastNHours(n) {
    for (var i = 1; i <= 12*n; i++) {
      var value = sheet.getRange(lastRow - 12*n + i, 3).getValue();
      if (value === 1) {
        return true;
      }
    }
    return false;
  }

  var average = 0;
  function lastNHoursAverageIsHigher(n) {
    var sum = 0;
    for (var i = 1; i <= 12*n; i++) {
      var value = sheet.getRange(lastRow - 12*n + i, 2).getValue();
      sum += value;
    }
    average = sum / (12*n);
    if (ALERT_TEMP < average) {
      return true;
    } else {
      return false;
    }
  }
  
  // 1桁の数字を0埋めで2桁にする
  // http://tagamidaiki.com/javascript-0-chink/
  var toDoubleDigits = function(num) {
    num += "";
    if (num.length === 1) {
      num = "0" + num;
    }
    return num;     
  };
    
  function sendEmailWithChart(to, subject, body) {
    var chart = (sheet.getCharts())[0].getBlob();
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: "<img src='cid:sampleCharts'><br>" + body,
      inlineImages: {
        sampleCharts: chart
      }
    });
  }
    
  // 新しいデータを追記する
  var newTemp = getPercent();
  var datetime = new Date();
  sheet.deleteRows(2, 1);  // 2行目を削除する
  sheet.appendRow([datetime, newTemp]);
  var newDateCell = sheet.getRange(sheet.getLastRow(), 1);
  newDateCell.setNumberFormat("M/d h:mm");

  if (lastTemp < ALERT_TEMP && ALERT_TEMP <= newTemp) {
    if (mailedInLastNHours(HOURS) || lastTwoHoursAverageIsHigher(HOURS)) {
      return;
    } else {
      var hh = toDoubleDigits(datetime.getHours());
      var mm = toDoubleDigits(datetime.getMinutes());
      var strTime = hh + ":" + mm;
      var MESSAGE = "寝室の気温が"+ALERT_TEMP+"°を超えました";
      // ツイートする
      var res = Twitter.tweet(
        MESSAGE + " " + strTime + 
        " by #IoT 温度計 http://qiita.com/weed/items/7ff7185ad76e591e684b");
      // メールする
      sendEmailWithChart(env.email.tatsuro, MESSAGE + " " + strTime, average);
      sendEmailWithChart(env.email.nobue  , MESSAGE + " " + strTime, "");
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