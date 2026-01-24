# React Bootcamp: From DOM to Declarative

**Duration:** 2 Days
**Prerequisites:** Knowledge of HTML, CSS, and Basic DOM Manipulation (document.querySelector, addEventListener).

---

### Module 1: The "Why" (Imperative vs. Declarative)

**Goal:** Prove that manual DOM manipulation does not scale and introduce the React Mental Model.

#### 1. The "Spaghetti" Problem (Vanilla JS)

- **The Task:** Create a list where clicking a button adds a new item.
- **The Struggle:**
  1.  Create the element: `const li = document.createElement('li')`
  2.  Add content: `li.innerText = 'New Item'`
  3.  Find parent: `const ul = document.querySelector('ul')`
  4.  Append: `ul.appendChild(li)`
  5.  **The Pain:** If data changes on the server, the UI doesn't know. You have to manually update the DOM every time.

#### 2. The React Solution

- **The Concept:** `UI = f(State)`
  - You don't touch the DOM.
  - You update the **Data** (State).
  - React updates the **DOM**.
- **Introduction to JSX:** It looks like HTML, but it's JavaScript logic.

---

### Module 2: Building the Todo App (State & Props)

**Goal:** Build a functional Todo App to understand `useState` and Data Flow.

#### 1. Components & Layout

- Break the app into pieces: `<App />`, `<TodoInput />`, `<TodoList />`.
- **Teaching Point:** Components are just custom HTML tags that run their own logic.

#### 2. `useState` (React's Memory)

- Introduce the Hook: `const [todos, setTodos] = useState([])`.
- **The Rule:** Never do `todos.push()`. Always use `setTodos()`.
- **Activity:** Create the state in `App.js` and render a hardcoded list using `.map()`.

#### 3. Prop Drilling (Passing Data)

- **The Challenge:** The input field is in `<TodoInput />`, but the list is in `<App />`. How do they talk?
- **The Solution:** Pass functions down as props.
  - Define `addTodo` function in `App`.
  - Pass it down: `<TodoInput onAdd={addTodo} />`.
  - Call it from the child.

---

### Module 3: Side Effects & The "Lifecycle"

**Goal:** Show why we cannot just run code anywhere we want. We will add a "Session Timer" to the Todo App.

#### 1. The Trap: The Infinite Loop

- **Scenario:** We want a counter that increments every second.
- **The "Naive" Approach:** Putting `setInterval` directly inside the component body.

  ```javascript
  // ❌ BAD CODE
  function Timer() {
    const [count, setCount] = useState(0);

    // This runs every time the component renders!
    setInterval(() => {
      setCount(count + 1);
    }, 1000);

    return <h1>Session Time: {count}</h1>;
  }
  ```

- **The Result:**
  1.  Render 1 starts a timer.
  2.  State updates → Re-render.
  3.  Render 2 starts **another** timer.
  4.  **Chaos:** The timer speeds up exponentially and crashes the browser.

#### 2. The Fix: `useEffect`

- **The Concept:** `useEffect` tells React to "Step outside the rendering flow."
- **The Fix:**

  ```javascript
  // ✅ GOOD CODE
  useEffect(() => {
    const id = setInterval(() => {
      setCount((prev) => prev + 1);
    }, 1000);

    // Cleanup function
    return () => clearInterval(id);
  }, []); // Empty array = Run only once on mount!
  ```

---

### Module 4: Polish & Recap

**Goal:** Solidify knowledge and review the "Rules of React."

#### 1. Conditional Rendering

- Show a message only if the list is empty.
  ```javascript
  {
    todos.length === 0 && <p>Good job! No tasks left.</p>;
  }
  ```

#### 2. Final Architecture Review

- **State:** Lives at the top (`App`).
- **Props:** Flow down.
- **Effects:** Handle things outside the UI (like our timer).

#### 3. Next Steps

- Brief mention of fetching data (API) using the same `useEffect` logic learned in the timer session.
