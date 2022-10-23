/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, {
  useContext, useEffect, useRef, useState,
} from 'react';
import {
  getTodos,
  addTodo,
  deleteTodo,
  switchTodoStatus,
  clearTodos,
} from './api/todos';
import { AuthContext } from './components/Auth/AuthContext';
import { Todo } from './types/Todo';
import { useError, useFilter, useLoader } from './utils/customHooks';

export const App: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = useContext(AuthContext);
  const newTodoField = useRef<HTMLInputElement>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError, clearError] = useError();
  const [filter, filterAll, filterActive, filterCompleted] = useFilter();
  const [isLoading, addToLoading, removeFromLoading] = useLoader();

  useEffect(() => {
    // focus the element with `ref={newTodoField}`
    if (newTodoField.current) {
      newTodoField.current.focus();
    }

    getTodos(user!.id)
      .then(
        res => setTodos(res),
        () => setError('Fetch fail'),
      );
  }, []);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {todos.length > 0 && (
            <button
              data-cy="ToggleAllButton"
              type="button"
              className="todoapp__toggle-all active"
            />
          )}
          <form>
            <input
              data-cy="NewTodoField"
              type="text"
              ref={newTodoField}
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();

                  if (e.target.value.length === 0) {
                    setError('Title can\'t be empty');
                  } else {
                    newTodoField.current!.readOnly = true;
                    newTodoField.current!.blur();
                    setTodos([
                      ...todos,
                      {
                        id: 0,
                        title: e.target.value,
                        completed: false,
                        userId: user!.id,
                      },
                    ]);
                    addToLoading(0);
                    addTodo(e.target.value, user!.id, false)
                      .then(
                        () => getTodos(user!.id)
                          .then(res => {
                            setTodos(res);
                            newTodoField.current!.value = '';
                            newTodoField.current!.focus();
                            newTodoField.current!.readOnly = false;
                            removeFromLoading(0);
                          }),
                        () => {
                          setError('Failed to add');
                          removeFromLoading(0);
                        },
                      );
                  }
                }
              }}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {todos
            .filter(todo => filter === null || todo.completed === filter)
            .map(todo => (
              <div
                data-cy="Todo"
                className={todo.completed ? 'todo completed' : 'todo'}
                key={todo.id}
              >
                <label className="todo__status-label">
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                    defaultChecked
                    onClick={() => {
                      addToLoading(todo.id);
                      switchTodoStatus(todo).then(
                        () => getTodos(user!.id)
                          .then(res => {
                            removeFromLoading(todo.id);
                            setTodos(res);
                          }),
                        () => {
                          removeFromLoading(todo.id);
                          setError('Unable to update');
                        },
                      );
                    }}
                  />
                </label>

                <span data-cy="TodoTitle" className="todo__title">
                  {todo.title}
                </span>
                <button
                  type="button"
                  className="todo__remove"
                  data-cy="TodoDeleteButton"
                  onClick={() => {
                    addToLoading(todo.id);
                    deleteTodo(todo.id).then(
                      () => getTodos(user!.id)
                        .then(res => {
                          removeFromLoading(todo.id);
                          setTodos(res);
                        }),
                      () => {
                        removeFromLoading(todo.id);
                        setError('Unable to remove');
                      },
                    );
                  }}
                >
                  ×
                </button>

                <div
                  data-cy="TodoLoader"
                  className={`modal overlay ${isLoading.includes(todo.id) && 'is-active'}`}
                >
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>
            ))}
        </section>
        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="todosCounter">
              {todos.filter(todo => !todo.completed).length}
              &nbsp;items left
            </span>

            <nav className="filter" data-cy="Filter">
              <a
                data-cy="FilterLinkAll"
                href="#/"
                className={`filter__link ${filter === null && 'selected'}`}
                onClick={() => filterAll()}
              >
                All
              </a>

              <a
                data-cy="FilterLinkActive"
                href="#/active"
                className={`filter__link ${filter === false && 'selected'}`}
                onClick={() => filterActive()}
              >
                Active
              </a>
              <a
                data-cy="FilterLinkCompleted"
                href="#/completed"
                className={`filter__link ${filter === true && 'selected'}`}
                onClick={() => filterCompleted()}
              >
                Completed
              </a>
            </nav>

            <button
              data-cy="ClearCompletedButton"
              type="button"
              className="todoapp__clear-completed"
              disabled={!todos.find(todo => todo.completed)}
              onClick={() => {
                clearTodos(todos
                  .filter(todo => todo.completed)
                  .map(todo => todo.id)).then(
                  () => getTodos(user!.id)
                    .then(res => {
                      setTodos(res);
                    }),
                  () => {
                    setError('Unable to clear');
                  },
                );
              }}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={
          `notification is-danger is-light has-text-weight-normal ${error || 'hidden'}`
        }
      >
        <>
          <button
            data-cy="HideErrorButton"
            type="button"
            className="delete"
            onClick={() => clearError()}
          />
          {error}
        </>
      </div>
    </div>
  );
};
