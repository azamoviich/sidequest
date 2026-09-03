import type { TypingQuestion } from "../typing-quiz-engine.js";

// Typed-answer coding questions, organized by category. Answers are kept
// short (one word/token where possible) since you're typing them exactly,
// not picking from options — `answers` lists accepted variants, matched
// case-insensitively after trimming.

export const frontendQuestions: TypingQuestion[] = [
  { prompt: "CSS property to change text color?", answers: ["color"] },
  { prompt: "HTML tag for the largest heading?", answers: ["h1"] },
  { prompt: "React hook for side effects?", answers: ["useeffect", "use effect"] },
  { prompt: "React hook for local component state?", answers: ["usestate", "use state"] },
  { prompt: "CSS unit relative to the viewport width?", answers: ["vw"] },
  { prompt: "CSS unit relative to the viewport height?", answers: ["vh"] },
  { prompt: "CSS layout model for 1D flexible rows/columns?", answers: ["flexbox", "flex"] },
  { prompt: "CSS layout model for 2D row/column layouts?", answers: ["grid", "css grid"] },
  { prompt: "DOM method to select an element by its id?", answers: ["getelementbyid"] },
  { prompt: "DOM method to select the first matching element via a CSS selector?", answers: ["queryselector"] },
  { prompt: "HTML attribute that provides alternative text for an image?", answers: ["alt"] },
  { prompt: "CSS property to control spacing INSIDE an element's border?", answers: ["padding"] },
  { prompt: "CSS property to control spacing OUTSIDE an element's border?", answers: ["margin"] },
  { prompt: "JS array method that creates a new array by transforming each item?", answers: ["map"] },
  { prompt: "JS array method that creates a new array with items passing a test?", answers: ["filter"] },
  { prompt: "JS keyword for a block-scoped constant?", answers: ["const"] },
  { prompt: "HTTP header used to specify the content's MIME type?", answers: ["content-type", "content type"] },
  { prompt: "CSS pseudo-class that targets an element on mouse hover?", answers: ["hover", ":hover"] },
  { prompt: "React: the special prop used to pass nested elements to a component?", answers: ["children"] },
  { prompt: "CSS property to make an element's position stick when scrolling past it?", answers: ["sticky", "position: sticky", "position sticky"] },
];

export const backendQuestions: TypingQuestion[] = [
  { prompt: "HTTP method typically used to retrieve data (safe, no side effects)?", answers: ["get"] },
  { prompt: "HTTP method typically used to create a new resource?", answers: ["post"] },
  { prompt: "HTTP method typically used to fully replace a resource?", answers: ["put"] },
  { prompt: "HTTP method typically used to delete a resource?", answers: ["delete"] },
  { prompt: "HTTP status code for 'Not Found'?", answers: ["404"] },
  { prompt: "HTTP status code for 'Internal Server Error'?", answers: ["500"] },
  { prompt: "HTTP status code for 'Unauthorized'?", answers: ["401"] },
  { prompt: "HTTP status code for a successful request?", answers: ["200"] },
  { prompt: "Default port HTTPS uses?", answers: ["443"] },
  { prompt: "Default port HTTP uses?", answers: ["80"] },
  { prompt: "SQL clause that filters rows BEFORE grouping?", answers: ["where"] },
  { prompt: "SQL clause that filters groups AFTER aggregation?", answers: ["having"] },
  { prompt: "SQL join that returns only matching rows in both tables?", answers: ["inner join", "inner"] },
  { prompt: "Acronym for a stateless architectural style for web APIs?", answers: ["rest"] },
  { prompt: "Data format most REST APIs use for request/response bodies?", answers: ["json"] },
  { prompt: "Auth: 3-letter acronym for a signed token format containing claims?", answers: ["jwt"] },
  { prompt: "The 'C' in ACID (database transactions)?", answers: ["consistency"] },
  { prompt: "The 'D' in ACID (database transactions)?", answers: ["durability"] },
  { prompt: "Common in-memory data store used for caching?", answers: ["redis"] },
  { prompt: "Protocol that translates domain names to IP addresses?", answers: ["dns"] },
];

export const nodejsQuestions: TypingQuestion[] = [
  { prompt: "Node.js package manager that ships with Node itself?", answers: ["npm"] },
  { prompt: "File that lists a Node project's exact locked dependency versions?", answers: ["package-lock.json", "package-lock"] },
  { prompt: "Node global object representing the current module?", answers: ["module"] },
  { prompt: "Node built-in module for reading/writing files?", answers: ["fs"] },
  { prompt: "Node built-in module for working with file/directory paths?", answers: ["path"] },
  { prompt: "Node function to read an environment variable, e.g. process.___.PORT?", answers: ["env"] },
  { prompt: "Event emitter method used to listen for an event?", answers: ["on"] },
  { prompt: "Node package for creating fast, minimal HTTP servers (very popular framework)?", answers: ["express"] },
  { prompt: "Command to run the tests defined in package.json's scripts?", answers: ["npm test", "npm run test"] },
  { prompt: "Command to install dependencies listed in package.json?", answers: ["npm install", "npm i"] },
  { prompt: "Node's non-blocking I/O model relies on this single-threaded construct?", answers: ["event loop"] },
  { prompt: "npm command to install a package as a dev-only dependency?", answers: ["npm install --save-dev", "npm i -d", "npm i --save-dev"] },
  { prompt: "Node global available in every module giving command-line args, env, etc?", answers: ["process"] },
  { prompt: "Node built-in module for creating HTTP servers?", answers: ["http"] },
];

export const algorithmQuestions: TypingQuestion[] = [
  { prompt: "Big-O of binary search on a sorted array?", answers: ["o(log n)", "log n", "o(logn)"] },
  { prompt: "Big-O of an average hash table lookup?", answers: ["o(1)"] },
  { prompt: "Big-O of quicksort's worst case?", answers: ["o(n^2)", "o(n2)", "o(n squared)"] },
  { prompt: "Data structure using LIFO ordering?", answers: ["stack"] },
  { prompt: "Data structure using FIFO ordering?", answers: ["queue"] },
  { prompt: "Tree traversal that visits the root before its children?", answers: ["pre-order", "preorder"] },
  { prompt: "Tree traversal that visits the root after its children?", answers: ["post-order", "postorder"] },
  { prompt: "Term for a function that calls itself?", answers: ["recursion", "recursive"] },
  { prompt: "Term for reusing cached results of expensive function calls?", answers: ["memoization", "memoisation"] },
  { prompt: "Sorting algorithm that repeatedly swaps adjacent out-of-order elements?", answers: ["bubble sort", "bubblesort"] },
  { prompt: "Graph traversal that explores as deep as possible before backtracking?", answers: ["dfs", "depth-first search", "depth first search"] },
  { prompt: "Graph traversal that explores level by level?", answers: ["bfs", "breadth-first search", "breadth first search"] },
];

export const gitQuestions: TypingQuestion[] = [
  { prompt: "Git command to create a new branch AND switch to it (checkout flag)?", answers: ["git checkout -b"] },
  { prompt: "Git command to temporarily shelve uncommitted changes?", answers: ["git stash"] },
  { prompt: "Git command to view commit history?", answers: ["git log"] },
  { prompt: "Git command to apply one specific commit onto the current branch?", answers: ["git cherry-pick"] },
  { prompt: "Git command to combine another branch's history into the current one?", answers: ["git merge"] },
  { prompt: "Git command to download changes from a remote without merging?", answers: ["git fetch"] },
  { prompt: "Git command that downloads AND merges changes from a remote?", answers: ["git pull"] },
  { prompt: "Git command to see which files changed / are staged?", answers: ["git status"] },
  { prompt: "Git command to stage a file for commit?", answers: ["git add"] },
];
