// import { useState, useEffect } from "react";

// export const useCountdown = (initialCount: number, onComplete: () => void) => {
//   const [count, setCount] = useState(initialCount);

//   useEffect(() => {
//     if (count <= 0) {
//       onComplete();
//       return;
//     }
//     const timer = setInterval(() => {
//       setCount((prev) => prev - 1);
//     }, 1000);
//     return () => clearInterval(timer);
//   }, [count, onComplete]);

//   return count;
// };
