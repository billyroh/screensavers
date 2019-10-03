function updateTime() {
  let time = new Date().toLocaleTimeString('en-US');
  let display = document.querySelector('.time');
  let hour = time.slice(0, time.indexOf(':'));
  let minute = time.slice(time.indexOf(':'), time.indexOf(':', 3));
  let amPm = time.slice(time.length - 2, time.length);
  time = `${hour} ${minute} ${amPm}`;
  display.innerHTML = time;
}

setInterval(() => {
  updateTime();
},
10000)

updateTime();