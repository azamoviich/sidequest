import type { QuizQuestion } from "../quiz-engine.js";

export const codingQuestions: QuizQuestion[] = [
  // JavaScript
  { prompt: "What does `typeof null` return in JavaScript?", choices: ["null", "undefined", "object", "boolean"], correctIndex: 2 },
  { prompt: "What does `[] + []` evaluate to in JavaScript?", choices: ['""', "NaN", "0", "undefined"], correctIndex: 0 },
  { prompt: "Which keyword declares a block-scoped, reassignable variable in JS?", choices: ["var", "let", "const", "def"], correctIndex: 1 },
  { prompt: "What does `Array.prototype.map` return?", choices: ["The original array mutated", "A new array", "undefined", "A boolean"], correctIndex: 1 },
  { prompt: "What is the result of `0.1 + 0.2 === 0.3` in JavaScript?", choices: ["true", "false", "NaN", "SyntaxError"], correctIndex: 1 },
  { prompt: "Which JS array method removes the last element?", choices: ["shift()", "pop()", "slice()", "splice(0)"], correctIndex: 1 },
  { prompt: "What does `NaN === NaN` evaluate to?", choices: ["true", "false", "NaN", "undefined"], correctIndex: 1 },
  { prompt: "In JS, what does the `??` operator do?", choices: ["Logical OR", "Nullish coalescing", "Optional chaining", "Bitwise XOR"], correctIndex: 1 },
  { prompt: "Which of these is NOT a JavaScript primitive type?", choices: ["symbol", "bigint", "array", "boolean"], correctIndex: 2 },
  { prompt: "What does `Promise.all` do if one promise in the array rejects?", choices: ["Ignores it", "Rejects immediately with that reason", "Waits for all regardless", "Returns undefined"], correctIndex: 1 },

  // Python
  { prompt: "What does `len([1, 2, 3])` return in Python?", choices: ["2", "3", "4", "Error"], correctIndex: 1 },
  { prompt: "Which Python keyword defines a function?", choices: ["func", "def", "function", "lambda"], correctIndex: 1 },
  { prompt: "What is the output of `print(2 ** 3)` in Python?", choices: ["6", "8", "9", "23"], correctIndex: 1 },
  { prompt: "What does a Python list comprehension `[x for x in range(3)]` produce?", choices: ["[0, 1, 2]", "[1, 2, 3]", "(0, 1, 2)", "Error"], correctIndex: 0 },
  { prompt: "Which of these is Python's mutable, ordered collection type?", choices: ["tuple", "list", "frozenset", "str"], correctIndex: 1 },
  { prompt: "What does `is` compare in Python, unlike `==`?", choices: ["Value equality", "Object identity", "Type only", "Nothing different"], correctIndex: 1 },
  { prompt: "What does the `self` parameter refer to in a Python method?", choices: ["The class itself", "The instance calling the method", "A global variable", "Nothing, it's optional syntax"], correctIndex: 1 },

  // Big-O / algorithms
  { prompt: "What is the time complexity of binary search on a sorted array?", choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correctIndex: 1 },
  { prompt: "What is the average time complexity of a hash table lookup?", choices: ["O(1)", "O(log n)", "O(n)", "O(n^2)"], correctIndex: 0 },
  { prompt: "What is the worst-case time complexity of quicksort?", choices: ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"], correctIndex: 2 },
  { prompt: "Which data structure uses LIFO (Last In, First Out) ordering?", choices: ["Queue", "Stack", "Linked list", "Heap"], correctIndex: 1 },
  { prompt: "Which data structure uses FIFO (First In, First Out) ordering?", choices: ["Stack", "Queue", "Tree", "Graph"], correctIndex: 1 },
  { prompt: "What is the time complexity of inserting into the middle of an array?", choices: ["O(1)", "O(log n)", "O(n)", "O(n^2)"], correctIndex: 2 },
  { prompt: "What traversal visits a binary tree's root before its children?", choices: ["In-order", "Post-order", "Pre-order", "Level-order"], correctIndex: 2 },
  { prompt: "What's the space complexity of an in-place bubble sort?", choices: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], correctIndex: 0 },

  // Git
  { prompt: "Which git command creates a new branch AND switches to it?", choices: ["git branch -b", "git checkout -b", "git switch --new", "git new-branch"], correctIndex: 1 },
  { prompt: "What does `git rebase` do, unlike `git merge`?", choices: ["Deletes commit history", "Rewrites commits onto a new base", "Only works on remote branches", "Nothing, they're identical"], correctIndex: 1 },
  { prompt: "Which command shows the commit history?", choices: ["git history", "git log", "git commits", "git show-all"], correctIndex: 1 },
  { prompt: "What does `git stash` do?", choices: ["Deletes uncommitted changes", "Temporarily shelves uncommitted changes", "Commits changes silently", "Pushes to a hidden branch"], correctIndex: 1 },
  { prompt: "Which command undoes the last commit but keeps the changes staged?", choices: ["git reset --hard HEAD~1", "git reset --soft HEAD~1", "git revert HEAD", "git checkout HEAD~1"], correctIndex: 1 },
  { prompt: "What does `git cherry-pick` do?", choices: ["Deletes a commit", "Applies a specific commit from another branch", "Merges all branches", "Lists tags"], correctIndex: 1 },

  // SQL
  { prompt: "Which SQL clause filters rows before grouping?", choices: ["HAVING", "WHERE", "GROUP BY", "ORDER BY"], correctIndex: 1 },
  { prompt: "Which SQL clause filters groups after aggregation?", choices: ["WHERE", "HAVING", "FILTER", "LIMIT"], correctIndex: 1 },
  { prompt: "What does an INNER JOIN return?", choices: ["All rows from both tables", "Only matching rows in both tables", "Only unmatched rows", "A random sample"], correctIndex: 1 },
  { prompt: "What does SQL's `NULL` represent?", choices: ["Zero", "Empty string", "Unknown/missing value", "False"], correctIndex: 2 },
  { prompt: "Which SQL statement removes rows from a table?", choices: ["REMOVE", "DELETE", "DROP", "TRUNCATE ONLY"], correctIndex: 1 },
  { prompt: "What does `DROP TABLE` do, unlike `DELETE FROM`?", choices: ["Nothing different", "Removes rows only", "Removes the entire table structure", "Only works on views"], correctIndex: 2 },

  // General CS / networking
  { prompt: "What does HTTP status code 404 mean?", choices: ["Server error", "Not found", "Unauthorized", "Redirect"], correctIndex: 1 },
  { prompt: "What does HTTP status code 500 mean?", choices: ["Not found", "Internal server error", "Success", "Forbidden"], correctIndex: 1 },
  { prompt: "What does REST stand for?", choices: ["Representational State Transfer", "Remote Execution State Transfer", "Rapid State Transport", "Real-time Event Streaming Tool"], correctIndex: 0 },
  { prompt: "What port does HTTPS typically use by default?", choices: ["80", "8080", "443", "22"], correctIndex: 2 },
  { prompt: "What does DNS translate?", choices: ["Domain names to IP addresses", "IP addresses to MAC addresses", "URLs to HTML", "Ports to protocols"], correctIndex: 0 },
  { prompt: "What does 'idempotent' mean for an HTTP method like PUT?", choices: ["It always fails", "Repeating it has the same effect as calling it once", "It can't be cached", "It requires authentication"], correctIndex: 1 },
  { prompt: "What is a race condition?", choices: ["A CPU scheduling algorithm", "When outcome depends on timing of concurrent operations", "A type of memory leak", "A network protocol"], correctIndex: 1 },
  { prompt: "What does 'idempotent' NOT guarantee?", choices: ["Same result on repeat calls", "That the operation has no side effects at all", "Safety for retries", "Predictable repeated behavior"], correctIndex: 1 },
  { prompt: "In Big-O notation, which grows fastest as n increases?", choices: ["O(n)", "O(n log n)", "O(2^n)", "O(log n)"], correctIndex: 2 },
  { prompt: "What is a closure in programming?", choices: ["A syntax error", "A function bundled with references to its surrounding scope", "A loop that never ends", "A type of database index"], correctIndex: 1 },
  { prompt: "What does 'DRY' stand for in software engineering?", choices: ["Design Rarely, Yield", "Don't Repeat Yourself", "Debug Rapidly, Yes", "Deploy Regularly, Yearly"], correctIndex: 1 },
  { prompt: "What is a memory leak?", choices: ["Data corruption on disk", "Memory that's allocated but never freed", "A CPU overheating issue", "A network packet loss"], correctIndex: 1 },
];
