import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './App.css';

function App() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [groupingOption, setGroupingOption] = useState('status');
  const [groupedTasks, setGroupedTasks] = useState({});
  const [sortingOption, setSortingOption] = useState({});
  const [isDisplayPopupOpen, setDisplayPopupOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.quicksell.co/v1/internal/frontend-assignment');
        const data = await response.json();
        setTickets(data.tickets);
        setUsers(data.users);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const sortTasks = useCallback((tasks) => {
    if (sortingOption === 'priority') {
      return tasks.slice().sort((a, b) => b.priority - a.priority);
    } else if (sortingOption === 'title') {
      return tasks.slice().sort((a, b) => a.title.localeCompare(b.title));
    }
    return tasks;
  }, [sortingOption]);

  useEffect(() => {
    const groupByStatus = () => {
      const allStatuses = ['Backlog', 'Todo', 'In progress', 'Done', 'Cancelled'];
      const groupedByStatus = allStatuses.reduce((acc, status) => {
        const tasksForStatus = tickets.filter(ticket => ticket.status === status);
        acc[status] = tasksForStatus;
        return acc;
      }, {});
      setGroupedTasks(groupedByStatus);
    };

    const groupByUser = () => {
      const groupedByUser = users.reduce((acc, user) => {
        if (!acc[user.name]) {
          acc[user.name] = [];
        }
        const userTickets = tickets.filter(ticket => ticket.userId === user.id);
        acc[user.name] = userTickets;
        return acc;
      }, {});
      setGroupedTasks(groupedByUser);
    };

    const groupByPriority = () => {
      const priorityLevels = ['No priority', 'Urgent', 'High', 'Medium', 'Low'];
      const groupedByPriority = priorityLevels.reduce((acc, priority) => {
        const tasksForPriority = tickets.filter(ticket => ticket.priority === priorityLevels.indexOf(priority));
        acc[priority] = tasksForPriority;
        return acc;
      }, {});
      setGroupedTasks(groupedByPriority);
    };

    if (groupingOption === 'status') {
      groupByStatus();
    } else if (groupingOption === 'user') {
      groupByUser();
    } else if (groupingOption === 'priority') {
      groupByPriority();
    }
  }, [groupingOption, tickets, users]);

  useEffect(() => {
    const sortedGroupedTasks = {};
    Object.keys(groupedTasks).forEach((group) => {
      sortedGroupedTasks[group] = sortTasks(groupedTasks[group]);
    });
    setGroupedTasks(sortedGroupedTasks);
  }, [sortingOption, groupedTasks, sortTasks]);

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
  
    const sourceColumn = groupedTasks[result.source.droppableId];
    const destinationColumn = groupedTasks[result.destination.droppableId];
    const [movedTask] = sourceColumn.splice(result.source.index, 1);
  
    destinationColumn.splice(result.destination.index, 0, movedTask);
  
    const updatedGroupedTasks = { ...groupedTasks };
    updatedGroupedTasks[result.source.droppableId] = sourceColumn;
    updatedGroupedTasks[result.destination.droppableId] = destinationColumn;
  
    setGroupedTasks(updatedGroupedTasks);
  };
  

  const toggleDisplayPopup = () => {
    setDisplayPopupOpen(!isDisplayPopupOpen);
  };

 

  useEffect(() => {
    const savedGroupingOption = localStorage.getItem('groupingOption');
    if (savedGroupingOption) {
      setGroupingOption(savedGroupingOption);
    }
  }, []);



  return (
    <div className="App">
      <div className="display-dropdown">
        <button className="display-button" onClick={toggleDisplayPopup}>
          ⚙️ Display
        </button>
        {isDisplayPopupOpen && (
          <div className="display-popup">
            <div className="grouping-dropdown">
              <label>Grouping:</label>
              <select
                value={groupingOption}
                onChange={(e) => setGroupingOption(e.target.value)}
              >
                <option value="status">Status</option>
                <option value="user">User</option>
                <option value="priority">Priority</option>
              </select>
            </div>
            <div className="sorting-dropdown">
              <label>Sorting:</label>
              <select
                value={sortingOption}
                onChange={(e) => setSortingOption(e.target.value)}
              >
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        )}
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board">
          {Object.keys(groupedTasks).map(group => (
            <div key={group} className="column">
              <h3>{group}</h3>
              <Droppable droppableId={group} key={group}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="task-list"
                  >
                    {groupedTasks[group].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                            className="task"
                          >
                            <div className="task-info">
                              <p className="task-id">ID: {task.id}</p>
                              <p className="task-title">{task.title}</p>
                              <p className="task-tag">Tag: {task.tag.join(', ')}</p>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
  
}

export default App;
