function sendHttpGetRequest(url, whatToDo) {
  let httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = () => {
    if (httpRequest.readyState == 4) {
      if (httpRequest.status == 200) {
        whatToDo(httpRequest.responseText);
      }
    }
  };
  httpRequest.open("GET", url, true);
  httpRequest.send();
}

function sendHttpPostRequest(url, whatToDo, body) {
  let httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = () => {
    if (httpRequest.readyState == 4) {
      if (httpRequest.status == 200) {
        whatToDo(httpRequest.responseText);
      }
    }
  };
  httpRequest.open("POST", url, true);
  httpRequest.send(body);
}
