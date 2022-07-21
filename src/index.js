class ToDoList {
    constructor () {
        this.tasks = [];
    }

    addTask(title, text) {
        const isUinque = this.checkUnique(title, text);

        if (isUinque) {
            const newTask = {
                title,
                text,
                state: false,
                uuid: Date.now()
            };

            this.tasks.push(newTask);
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(({ uuid }) => uuid !== Number(id));
    }

    editTask(id, titleEdited, textEdited) {
        const editIndex = this.tasks.findIndex(item => item.uuid === Number(id));
        const notFoundIndex = -1;
        const isUinque = this.checkUnique(titleEdited, textEdited);
        const isEmpty = !titleEdited && !textEdited;

        if (editIndex === notFoundIndex) return;

        if(isUinque && !isEmpty) {
            this.tasks[editIndex].title = titleEdited;
            this.tasks[editIndex].text = textEdited;
        } else if (!isUinque || isEmpty) {
            this.deleteTask(id);
        }
    }

    toggleState(id) {
        const index = this.tasks.findIndex(item => item.uuid === Number(id));
        const notFoundIndex = -1;

        if (index!== notFoundIndex) {
            this.tasks[index].state = !this.tasks[index].state;
        }
    }

    getStatisctics() {
        return this.tasks.reduce((accum, item) => {
            item.state ? accum.completed++ : accum.active++;
            return accum;
        }, {
            active: 0,
            completed: 0,
            total: this.tasks.length
        });
    }

    checkUnique (title, text){
        return !this.tasks.find(item => (item.title === title) && (item.text === text));
    }
}

Object.defineProperties(ToDoList.prototype, {
    addTask: {configurable: false},
    deleteTask: {configurable: false},
    editTask: {configurable: false},
    toggleState: {configurable: false},
    getStatisctics: {configurable: false},
    checkUnique: {configurable: false},
});


class TodoListView {
    constructor (listModel) {
        this.listModel = listModel;
        this.addForm = document.querySelector('.add-form');
        this.list = document.querySelector('.list');

        this.updateLocalStorage = function(tasks) {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        };

        this.getFromLocalStorage = function() {
            const ref = localStorage.getItem('tasks');
            if(ref) {
                this.listModel.tasks = JSON.parse(ref);
                this.renderToDoList();
            }
        };

        this.renderToDoList = function(){
            this.list.innerHTML = '';

            if (!this.listModel.tasks.length) return;
            const fragment = new DocumentFragment;

            for (const toDoItem of this.listModel.tasks) {

                const li = document.createElement('li');
                li.classList.add('list-item');
                li.dataset.id = toDoItem.uuid;

                const task = document.createElement('div');
                task.classList.add('task');

                const taskTitle = document.createElement('h3');
                taskTitle.classList.add('task__title');
                taskTitle.textContent = toDoItem.title;

                const taskText = document.createElement('p');
                taskText.classList.add('task__text');
                taskText.textContent = toDoItem.text;

                task.append(taskTitle, taskText);

                const checkbox = document.createElement('input');
                checkbox.classList.add('list-item__state');
                checkbox.setAttribute('type', 'checkbox');
                li.append(task, checkbox);

                li.insertAdjacentHTML('beforeend',
                    `<button type="button" class="button list-item__edit fa-solid fa-pen-to-square">
        </button><button type="button" class="button list-item__delete fa-solid fa-xmark"></button>`);

                if (toDoItem.state) {
                    li.classList.add('completed');
                    checkbox.setAttribute('checked', '');
                }

                fragment.append(li);
            }
            this.list.append(fragment);
        };

        this.initSubmit = function() {
            this.addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const data = new FormData(e.target);
                const title = data.get('title').trim();
                const text = data.get('text').trim();

                if (title && text) {
                    listModel.addTask(title, text);
                    this.updateLocalStorage(listModel.tasks);
                    this.renderToDoList();
                    e.target.reset();
                }
            });
        };

        this.initRemove = function(){
            this.list.addEventListener('click', ({target}) => {
                if (!target.classList.contains('list-item__delete')) return;

                const deleteItem = target.closest('[data-id]');
                const id = deleteItem.getAttribute('data-id');

                if (id) {
                    this.listModel.deleteTask(id);
                    this.updateLocalStorage(listModel.tasks);
                    this.renderToDoList();
                }
            });
        };

        this.initToogleState = function(){
            this.list.addEventListener('change', ({target}) => {
                if (!target.classList.contains('list-item__state')) return;

                const toggleItem = target.closest('[data-id]');
                const id = toggleItem.getAttribute('data-id');

                if (id) {
                    this.listModel.toggleState(id);
                    toggleItem.classList.toggle('completed');
                    this.updateLocalStorage(listModel.tasks);
                }
            });
        };

        this.initEdit = function(){
            this.list.addEventListener('click', ({target}) => {
                if (!target.classList.contains('list-item__edit')) return;

                target.style.display = 'none';

                const editItem = target.closest('[data-id]');
                const id = editItem.getAttribute('data-id');

                if (!id) return;

                const task = document.querySelector(`li[data-id="${id}"] > .task`);
                const taskTitle = document.querySelector(`li[data-id="${id}"] .task__title`).innerText;
                const taskText = document.querySelector(`li[data-id="${id}"] .task__text`).innerText;

                const fragment = new DocumentFragment;
                const form = document.createElement('form');
                form.classList.add('edit-form');
                form.setAttribute('name', 'editForm');

                const title = document.createElement('input');
                title.classList.add('input', 'edit-form__title');
                title.setAttribute('type', 'text');
                title.setAttribute('name', 'title');
                title.setAttribute('value', `${taskTitle}`);

                const text = document.createElement('input');
                text.classList.add('input', 'edit-form__text');
                text.setAttribute('type', 'text');
                text.setAttribute('name', 'text');
                text.setAttribute('value', `${taskText}`);

                const submit = document.createElement('button');
                submit.classList.add('button', 'edit-form__save');
                submit.textContent = 'Save';

                const cancel = document.createElement('button');
                cancel.classList.add('button', 'edit-form__cancel');
                cancel.textContent = 'Cancel';

                form.append(title, text, submit, cancel);
                fragment.append(form);
                task.innerHTML = '';
                task.append(fragment);

                const editForm = document.querySelector('.edit-form');

                editForm.addEventListener('submit', (e) => {
                    e.preventDefault();

                    if (e.submitter.classList.contains('edit-form__save')) {
                        const data = new FormData(e.target);
                        const titleEdited = data.get('title').trim();
                        const textEdited = data.get('text').trim();

                        this.listModel.editTask(id, titleEdited, textEdited);
                        this.updateLocalStorage(listModel.tasks);
                        this.renderToDoList();
                    } else if (e.submitter.classList.contains('edit-form__cancel')) {
                        this.renderToDoList();
                    }
                });

            });
        };

        this.initStatistics = function(){
            const statistics = document.querySelector('.statistics-btn');
            const activeTasks = document.querySelector('.statistics-list__active');
            const completedTasks = document.querySelector('.statistics-list__completed');
            const totalTasks = document.querySelector('.statistics-list__total');

            statistics.addEventListener('click', () => {
                const result = this.listModel.getStatisctics();
                const {active, completed, total} = result;
                activeTasks.innerText = `Active tasks: ${active}`;
                completedTasks.innerText = `Completed tasks: ${completed}`;
                totalTasks.innerText = `Total: ${total}`;
            });

            statistics.addEventListener('blur', () => {
                activeTasks.innerText = '';
                completedTasks.innerText = '';
                totalTasks.innerText = '';
            });
        };

        this.getFromLocalStorage();
        this.initSubmit();
        this.initRemove();
        this.initToogleState();
        this.initStatistics();
        this.initEdit();
    }
}

// eslint-disable-next-line no-unused-vars
const toDo = new TodoListView(new ToDoList);