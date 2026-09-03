export interface DailyChallenge {
  category: string;
  prompt: string;
  answers: string[]; // matched case-insensitively after trimming
  hint?: string;
}

// Original, hand-written challenges — deliberately short/unambiguous so a
// single typed answer can be checked exactly. One per day is picked
// deterministically from this bank (see daily-challenge.ts), so everyone
// playing on a given date gets the same challenge.
export const DAILY_CHALLENGES: DailyChallenge[] = [
  // Logic
  { category: "Logic", prompt: "All Bloops are Razzies. All Razzies are Lazzies. Are all Bloops definitely Lazzies? (yes/no)", answers: ["yes"] },
  { category: "Logic", prompt: "Three boxes are labeled 'Apples', 'Oranges', and 'Both' — but every label is wrong. You pick one fruit from the box labeled 'Apples' and it's an orange. What's actually in the box labeled 'Both'?", answers: ["apples"] },
  { category: "Logic", prompt: "A is taller than B. C is shorter than B. Is A definitely taller than C? (yes/no)", answers: ["yes"] },
  { category: "Logic", prompt: "If it's true that 'no cats are dogs', is it also true that 'no dogs are cats'? (yes/no)", answers: ["yes"] },
  { category: "Logic", prompt: "Five people finish a race with no ties. Ann beats Ben. Cal beats Dan. Ben beats Cal. Dan beats Ed. Who finished 1st?", answers: ["ann"] },
  { category: "Logic", prompt: "Every Zorp is a Florp. Some Florps are Glorps. Can you conclude that some Zorps are definitely Glorps? (yes/no)", answers: ["no"] },

  // Math
  { category: "Math", prompt: "A bat and a ball cost $1.10 total. The bat costs $1.00 more than the ball. How much does the ball cost, in cents?", answers: ["5", "5 cents", "0.05"] },
  { category: "Math", prompt: "What is the next number: 2, 6, 12, 20, 30, ?", answers: ["42"] },
  { category: "Math", prompt: "If 5 machines make 5 widgets in 5 minutes, how many minutes do 100 machines take to make 100 widgets?", answers: ["5"] },
  { category: "Math", prompt: "A number doubled, then increased by 10, equals 30. What was the original number?", answers: ["10"] },
  { category: "Math", prompt: "What's the smallest positive integer divisible by both 6 and 8?", answers: ["24"] },
  { category: "Math", prompt: "How many degrees are in the interior angles of a triangle, total?", answers: ["180"] },

  // Pattern recognition
  { category: "Pattern", prompt: "Complete the pattern: A, C, F, J, O, ?", answers: ["u"] },
  { category: "Pattern", prompt: "What's next in the sequence: 1, 1, 2, 3, 5, 8, 13, ?", answers: ["21"] },
  { category: "Pattern", prompt: "What's next: 3, 9, 27, 81, ?", answers: ["243"] },
  { category: "Pattern", prompt: "Complete: Z, Y, X, W, ?", answers: ["v"] },
  { category: "Pattern", prompt: "What's next: 1, 4, 9, 16, 25, ?", answers: ["36"] },

  // Riddles
  { category: "Riddle", prompt: "The more you take, the more you leave behind. What am I?", answers: ["footsteps", "steps"] },
  { category: "Riddle", prompt: "I have keys but no locks, space but no room. You can enter but not go outside. What am I?", answers: ["keyboard"] },
  { category: "Riddle", prompt: "What has a face and two hands but no arms or legs?", answers: ["clock", "a clock"] },
  { category: "Riddle", prompt: "What gets wetter the more it dries?", answers: ["towel", "a towel"] },
  { category: "Riddle", prompt: "What can travel around the world while staying in a corner?", answers: ["stamp", "a stamp"] },

  // Lateral thinking
  { category: "Lateral thinking", prompt: "A man pushes his car to a hotel and tells the owner he's bankrupt. Why? (one word: it's a board game)", answers: ["monopoly"] },
  { category: "Lateral thinking", prompt: "A woman shoots her husband, holds him underwater for 5 minutes, then hangs him. 5 minutes later they enjoy dinner together. How? (one word: her job)", answers: ["photographer"] },
  { category: "Lateral thinking", prompt: "How can a man go eight days without sleep? (one word)", answers: ["nights"] },

  // Spot the bug
  { category: "Spot the bug", prompt: "for (let i = 0; i <= arr.length; i++) { console.log(arr[i]); } — what's the bug? (one word: the comparison operator that's wrong)", answers: ["<="] },
  { category: "Spot the bug", prompt: "function isEven(n) { return n % 2 = 0; } — what's the bug? (the wrong operator, as typed)", answers: ["=", "single equals"] },
  { category: "Spot the bug", prompt: "const users = ['Alex','Bob']; users.map(u => { if (u==='Bob') return; console.log(u) }); — what does .map produce for 'Bob' instead of nothing? (one word)", answers: ["undefined"] },
  { category: "Spot the bug", prompt: "let sum = 0; for (let i = 1; i < 10; i++) sum += i; — this sums 1 to 9, not 1 to 10. What operator should replace '<'? (as typed)", answers: ["<="] },
  { category: "Spot the bug", prompt: "SELECT * FROM users WHERE name = 'O'Brien'; — what's the bug, in one word (a punctuation issue)?", answers: ["quote", "apostrophe", "unescaped quote"] },

  // Estimation (specific, well-defined answers — not open Fermi estimates)
  { category: "Estimation", prompt: "How many bones are in the adult human body?", answers: ["206"] },
  { category: "Estimation", prompt: "How many minutes are in exactly one week?", answers: ["10080"] },
  { category: "Estimation", prompt: "Roughly how many seconds are in a day? (round to nearest thousand)", answers: ["86400"] },
  { category: "Estimation", prompt: "How many players are on a standard soccer team on the field at once (one side)?", answers: ["11"] },

  // Mini cryptography
  { category: "Cryptography", prompt: "Caesar cipher, shift 1: decode 'IFMMP' (each letter shifted forward by 1 from the original)", answers: ["hello"] },
  { category: "Cryptography", prompt: "Caesar cipher, shift 3: decode 'FRGH' (each letter shifted forward by 3 from the original)", answers: ["code"] },
  { category: "Cryptography", prompt: "Base64 decode: 'aGVsbG8=' — what's the decoded word?", answers: ["hello"] },
  { category: "Cryptography", prompt: "Base64 decode: 'd29ybGQ=' — what's the decoded word?", answers: ["world"] },
  { category: "Cryptography", prompt: "ROT13 decode: 'jbeyq' — what's the decoded word?", answers: ["world"] },
];
