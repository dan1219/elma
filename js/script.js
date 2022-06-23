const btnLeft = document.getElementById('btn-left')
const btnRight = document.getElementById('btn-right')

let currentDate = new Date()
let datesCount = 7

//задачи
let taskArr = []

//пользователи
let usersArr = []

btnLeft.addEventListener('click', (e) => {
  currentDate.setTime(currentDate.getTime() - datesCount * 24 * 3600 * 1000)
  update()
})

btnRight.addEventListener('click', (e) => {
  currentDate.setTime(currentDate.getTime() + datesCount * 24 * 3600 * 1000)
  update()
})

//Получение списка пользователей
const getUsers = async () => {
  const response = await fetch('https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/users?limit=15')
  const users = await response.json()
  return users
}

//Получение спимска задач
const getTasks = async () => {
  const response = await fetch('https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/tasks')
  const tasks = await response.json()
  return tasks
}

const getDates = () => {
  const today = currentDate.getDate()
  const month = currentDate.getMonth()

  const weekElements = document.getElementsByClassName('scheduler__date')
  let tempDate = new Date(currentDate)

  for (let i = 0; i < weekElements.length; i++) {
    //const resultDate = convertDate(tempDate)
    const {
      date,
      month,
      year
    } = convertDate(tempDate)
    weekElements[i].innerHTML = date + '.' + month
    const dateAttr = `${year}-${month}-${date}`
    weekElements[i].setAttribute('date', dateAttr)
    tempDate.setTime(tempDate.getTime() + 24 * 3600 * 1000)
  }
}

const convertDate = (dateToConvert) => {
  let date = dateToConvert.getDate()
  let month = dateToConvert.getMonth() + 1
  const year = dateToConvert.getFullYear()
  if (date < 10)
    date = '0' + date
  if (month < 10)
    month = '0' + month

  dateObj = {
    date,
    month,
    year
  }
  return dateObj
}

//обновление списка дат
getDates()

//обновление списка заданий
const updateTaskList = () => {
  for (let i = 0; i < taskArr.length; i++) {
    taskArr[i].dateAvailable = isStartDateAvailable(taskArr[i].startDate)
  }
  renderTasks(taskArr)
}

//обновление ячеек планировщика
const updateSchedulerWorkflow = () => {
  //очистка планировщика
  const className = 'scheduler__workflow-elem'
  const elements = document.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }

  const getIndexesOfCell = (task) => {
    const schedulerDates = document.getElementsByClassName('scheduler__date')
    let dateIndex
    for (let i = 0; i < schedulerDates.length; i++) {
      const dateAttr = schedulerDates[i].getAttribute('date')
      if (dateAttr == task.startDate) {
        dateIndex = i
        break
      }
    }

    const schedulerUsers = document.getElementsByClassName('scheduler__user')
    let userIndex

    for (let i = 0; i < schedulerUsers.length; i++) {
      const idAttr = schedulerUsers[i].getAttribute('id')

      if (idAttr == task.executorId) {
        userIndex = i
        break
      }
    }

    const indexObj = {
      dateIndex,
      userIndex
    }
    return indexObj
  }

  for (let i = 0; i < taskArr.length; i++) {
    if (taskArr[i].dateAvailable && taskArr[i].executorId) {
      const {
        dateIndex,
        userIndex
      } = getIndexesOfCell(taskArr[i])

      const schedulerWorkflowArr = document.getElementsByClassName("scheduler__workflow")

      const workFlowElement = document.createElement('div')
      workFlowElement.classList.add('scheduler__workflow-elem')
      workFlowElement.innerHTML = taskArr[i].subject
      workFlowElement.id = taskArr[i].id
      workFlowElement.setAttribute('draggable', true)
      const resultIndex = userIndex * datesCount + dateIndex
      schedulerWorkflowArr[resultIndex].append(workFlowElement)
    }
  }

}

const update = () => {
  getDates()
  updateTaskList()
  updateSchedulerWorkflow()
}


getUsers()
  .then(res => {
    usersArr = res

    createUserRows(usersArr, datesCount)
    initDragAndDrop()

    getTasks()
      .then(res => {
        taskArr = res.map(elem => {
          const dateAvailable = isStartDateAvailable(elem.planStartDate)
          return {
            id: elem.id,
            subject: elem.subject,
            executorId: elem.executor,
            startDate: elem.planStartDate,
            endDate: elem.planEndDate,
            dateAvailable
          }
        })
        const backlogElement = document.getElementById('backlog')
        backlogElement.style = "display:block;"
        renderTasks(taskArr)
        updateSchedulerWorkflow()
      })
  })

const createUserRows = (users, count) => {
  for (let i = 0; i < users.length; i++) {
    const {
      firstName,
      surname,
      id
    } = users[i]

    const schedulerTasksElement = document.getElementById('scheduler__tasks')

    const schedulerUserElement = document.createElement('div')
    schedulerUserElement.classList.add('scheduler__user')
    schedulerUserElement.setAttribute('id', id)
    const nameElement = document.createElement('div')
    nameElement.innerHTML = firstName + ' ' + surname
    schedulerUserElement.append(nameElement)

    schedulerTasksElement.append(schedulerUserElement)

    for (let j = 0; j < count; j++) {
      const schedulerWorkflowElement = document.createElement('div')
      schedulerWorkflowElement.classList.add('scheduler__workflow')
      schedulerWorkflowElement.setAttribute('ondrop', true)
      schedulerTasksElement.append(schedulerWorkflowElement)
    }
  }
}

//проверка, отображена ли дата начала задания
const isStartDateAvailable = (date) => {
  const schedulerDateArr = document.getElementsByClassName('scheduler__date')
  for (let i = 0; i < schedulerDateArr.length; i++) {
    const attrDate = schedulerDateArr[i].getAttribute('date')
    if (date == attrDate)
      return true
  }
  return false
}

//отрисовка списка заданий
const renderTasks = (tasks) => {
  const className = 'scheduler__backlog-task'
  const elements = document.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }

  const elementsArr = []

  const backLogElement = document.getElementById('backlog')
  tasks.forEach((elem) => {
    if (!elem.executorId) {
      const taskElement = document.createElement('div')
      taskElement.classList.add(className)

      taskElement.innerHTML = elem.subject
      taskElement.id = elem.id
      taskElement.setAttribute('draggable', true)
      backLogElement.append(taskElement)
      elementsArr.push(taskElement)

      const prompt = document.createElement('div')
      prompt.classList.add('prompt')
      prompt.innerHTML = `Крайний срок: ${elem.endDate}`
      taskElement.append(prompt)
    }
  });

  const dragStartHandler = e => {
    const id = e.target.getAttribute('id')
    const taskElem = getTaskById(id, tasks)

    const transferObjText = JSON.stringify(taskElem)
    e.dataTransfer.setData("taskelem", transferObjText)
  }
  elementsArr.forEach((item) => {
    item.addEventListener('dragstart', dragStartHandler)
  });

}

//Получение задачи по id
const getTaskById = (id, tasks) => {
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].id == id)
      return tasks[i]
  }
}

//обработка drop события для класса workFlow
const workFlowDropHandler = (e) => {
  const searhInputElement = document.getElementById('search')
  searhInputElement.value = ''
  e.preventDefault()
  e.target.classList.remove('dragover')

  if (!e.currentTarget.getAttribute("ondrop"))
    return false;

  const dataObj = JSON.parse(e.dataTransfer.getData('taskelem'))
  const {
    subject: taskName,
    id: taskId
  } = dataObj

  let dateIndex = 0
  let tempCurrentTargetElement = e.currentTarget
  while (!tempCurrentTargetElement.classList.contains('scheduler__user')) {
    dateIndex++
    tempCurrentTargetElement = tempCurrentTargetElement.previousElementSibling
  }

  dateIndex--
  const userId = tempCurrentTargetElement.getAttribute('id')

  const schedulerDateElements = document.getElementsByClassName('scheduler__date')
  const schedulerDateElement = schedulerDateElements[dateIndex]
  const dateAttr = schedulerDateElement.getAttribute('date')

  taskArr.forEach((item) => {
    if (item.id == taskId) {
      item.executorId = userId
      item.startDate = dateAttr
    }
  });

  update()
  renderTasks(taskArr)
}
//обработка события dragOver
const workFlowDragOverHandler = (e) => {
  event.preventDefault();
  e.currentTarget.classList.add('dragover')
}
//обработка события dragLeave
const workFlowDragLeaveHandler = (e) => {
  e.currentTarget.classList.remove('dragover')
}

const workFlowDragStartHandler = (e) => {
  const id = e.target.getAttribute('id')

  const taskElem = getTaskById(id, taskArr)

  const transferObjText = JSON.stringify(taskElem)
  e.dataTransfer.setData("taskelem", transferObjText)
}

//обработка drop события для backlog
const backlogDropEventHandler = (e) => {
  const searhInputElement = document.getElementById('search')
  searhInputElement.value = ''
  e.preventDefault()
  e.currentTarget.classList.remove('dragover')

  if (!e.currentTarget.getAttribute("ondrop"))
    return false;
  const dataObj = JSON.parse(e.dataTransfer.getData('taskelem'))
  const {
    subject: taskName,
    id: taskId
  } = dataObj

  taskArr.forEach((item) => {
    if (item.id == taskId) {
      item.executorId = null
      item.startDate = null
    }
  });

  update()
  renderTasks(taskArr)
}

const initDragAndDrop = () => {
  const searhInputElement = document.getElementById('search')
  searhInputElement.value = ''

  const workflowElementsArr = document.getElementsByClassName('scheduler__workflow')

  for (let i = 0; i < workflowElementsArr.length; i++) {
    workflowElementsArr[i].addEventListener('drop', workFlowDropHandler)
    workflowElementsArr[i].addEventListener('dragover', workFlowDragOverHandler)
    workflowElementsArr[i].addEventListener('dragleave', workFlowDragLeaveHandler)
    workflowElementsArr[i].addEventListener('dragstart', workFlowDragStartHandler)
  }

  const backlogElement = document.getElementById('backlog')
  backlogElement.addEventListener('dragover', workFlowDragOverHandler)
  backlogElement.addEventListener('dragleave', workFlowDragLeaveHandler)
  backlogElement.addEventListener('drop', backlogDropEventHandler)
}

//поиск
const searhInputElement = document.getElementById('search')
searhInputElement.addEventListener("input", (e) => {
  let textToFind = e.target.value
  textToFind = textToFind.toLowerCase()

  const taskElements = document.getElementsByClassName('scheduler__backlog-task')

  if (textToFind) {
    for (let i = 0; i < taskElements.length; i++) {
      let taskText = taskElements[i].childNodes[0].nodeValue
      taskText = taskText.toLowerCase()

      if (!taskText.startsWith(textToFind))
        taskElements[i].classList.add('hidden')
    }
  } else {
    for (let i = 0; i < taskElements.length; i++) {
      taskElements[i].classList.remove('hidden')
    }
  }
});
