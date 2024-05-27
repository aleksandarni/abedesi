document.addEventListener('DOMContentLoaded', function() {
  const linesElement = document.getElementById('lines');
  const scheduleElement = document.getElementById('schedule');
  const timesElement = document.getElementById('times');
  const tabsElement = document.getElementById('tabs');
  const typeTabsElement = document.getElementById('type-tabs');
  const directionButton = document.getElementById('direction-button');
  const headerElement = document.getElementById('header'); // Added header element
  let currentDirection = 'start'; // Default direction
  let currentTab = 'workdays'; // Default tab

  // Fetch lines
  fetch('https://aleksandarni.github.io/abedesi/data/lines-min.json')
    .then(response => response.json())
    .then(lines => {
      // Create tabs for line types
      const types = ['Gradska', 'Prigradska'];
      types.forEach(type => {
        const typeButton = document.createElement('button');
        typeButton.textContent = type;
        typeButton.onclick = () => {
          document.querySelectorAll('#type-tabs button').forEach(btn => btn.classList.remove('active'));
          typeButton.classList.add('active');
          displayLines(lines, type);
        };
        typeTabsElement.appendChild(typeButton);
      });
      // Set the first tab as active by default and display Gradska lines
      if (types.length > 0) {
        typeTabsElement.firstChild.classList.add('active');
        displayLines(lines, types[0]);
      }
    });

  directionButton.onclick = () => {
    currentDirection = currentDirection === 'start' ? 'finish' : 'start';
    updateDirectionButton();
    if (timesElement.style.display === 'block') {
      const selectedLine = document.querySelector('.line.selected');
      if (selectedLine) {
        const [lineName, start, finish] = selectedLine.dataset.info.split('|');
        showTimes(lineName, currentDirection === 'start' ? start : finish, start, finish, selectedLine.dataset.comment, selectedLine.dataset.comment2);
      }
    } else {
      const activeTab = document.querySelector('#type-tabs .active');
      if (activeTab) {
        const type = activeTab.textContent;
        fetch('https://aleksandarni.github.io/abedesi/data/lines-min.json')
          .then(response => response.json())
          .then(lines => displayLines(lines, type));
      }
    }
  };

  function updateDirectionButton() {
    directionButton.textContent = `Switch to ${currentDirection === 'start' ? 'finish' : 'start'} direction`;
  }

  function displayLines(lines, type) {
    linesElement.innerHTML = ''; // Clear previous lines
    typeTabsElement.style.display = 'block'; // Show type tabs

    const filteredLines = lines.filter(line => {
      if (typeof line.start !== 'string' || typeof line.finish !== 'string') {
        return false;
      }

      if (type === 'Gradska') {
        return line.start !== 'Niš' && line.finish !== 'Niš';
      } else {
        return line.start === 'Niš' || line.finish === 'Niš';
      }
    });

    filteredLines.forEach(line => {
      const lineElement = document.createElement('div');
      lineElement.className = 'line';
      lineElement.dataset.info = `${line.name}|${line.start}|${line.finish}`;
      lineElement.dataset.comment = line.comment;
      lineElement.dataset.comment2 = line.comment2;
      const lineName = document.createElement('h2');
      lineName.textContent = `${line.name}: ${line.start} - ${line.finish}`;
      lineName.onclick = () => {
        document.querySelectorAll('.line').forEach(line => line.classList.remove('selected'));
        lineElement.classList.add('selected');
        showTimes(line.name, currentDirection === 'start' ? line.start : line.finish, line.start, line.finish, line.comment, line.comment2);
      };
      lineElement.appendChild(lineName);
      linesElement.appendChild(lineElement);
    });

    updateDirectionButton();
  }

  function showTimes(lineName, start, originalStart, originalFinish, comment, comment2) {
    linesElement.style.display = 'none';
    timesElement.style.display = 'block';
    scheduleElement.innerHTML = '';
    tabsElement.innerHTML = ''; // Clear previous tabs
    typeTabsElement.style.display = 'none'; // Hide type tabs

    // Update header with current direction
    headerElement.textContent = `Red vožnje za liniju ${lineName}: ${start} - ${start === originalStart ? originalFinish : originalStart}`;

    fetch('https://aleksandarni.github.io/abedesi/data/times-min.json')
      .then(response => response.json())
      .then(times => {
        const lineTimes = times.filter(time => time.name === lineName && time.start === start);

        // Create tabs for days
        const days = ['workdays', 'saturday', 'sunday'];
        days.forEach(day => {
          const tabButton = document.createElement('button');
          tabButton.textContent = day.charAt(0).toUpperCase() + day.slice(1);
          tabButton.onclick = () => {
            displayDayTimes(lineTimes, day);
            highlightTab(tabButton);
            currentTab = day; // Save the current tab
          };
          tabsElement.appendChild(tabButton);

          if (day === currentTab) {
            displayDayTimes(lineTimes, day);
            highlightTab(tabButton);
          }
        });

        // Add comments
        const legendElement = document.createElement('div');
        legendElement.className = 'legend';
        legendElement.innerHTML = `<p>${comment}</p><p>${comment2}</p>`;
        scheduleElement.appendChild(legendElement);
      });
  }

  function displayDayTimes(lineTimes, day) {
    scheduleElement.innerHTML = ''; // Clear previous schedule but keep legend

    const dayTimes = lineTimes.filter(time => time[day] && time[day].trim() !== '');
    const hours = [...new Set(dayTimes.map(time => time.hour))];

    const currentHour = new Date().getHours();

    hours.forEach(hour => {
      const hourElement = document.createElement('div');
      hourElement.className = 'hour';
      if (parseInt(hour) === currentHour) {
        hourElement.classList.add('current-hour');
      }
      const hourTitle = document.createElement('h4');
      hourTitle.textContent = `${hour}`;
      hourElement.appendChild(hourTitle);

      const hourTimes = dayTimes.filter(time => time.hour === hour);
      const timesList = document.createElement('ul');
      timesList.className = 'times';

      hourTimes.forEach(time => {
        const timeItem = document.createElement('li');
        timeItem.textContent = `${time[day]}`;
        timesList.appendChild(timeItem);
      });

      hourElement.appendChild(timesList);
      scheduleElement.appendChild(hourElement);
    });

    // Re-add comments to the schedule
    const legendElement = document.querySelector('.legend');
    if (legendElement) {
      scheduleElement.appendChild(legendElement);
    }
  }

  function highlightTab(tabButton) {
    const allTabs = document.querySelectorAll('#tabs button');
    allTabs.forEach(tab => tab.style.backgroundColor = '#007bff');
    tabButton.style.backgroundColor = '#ff6347'; // More visible color for active tab
  }

  window.showLines = function() {
    linesElement.style.display = 'block';
    timesElement.style.display = 'none';
    typeTabsElement.style.display = 'block'; // Show type tabs
    updateDirectionButton();
  };
});
