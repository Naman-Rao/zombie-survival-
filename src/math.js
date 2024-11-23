// Math utility functions encapsulated in an IIFE (Immediately Invoked Function Expression)
export const math = (function() {
  return {
    // Generates a random number between a and b
    rand_range: function(a, b) {
      return Math.random() * (b - a) + a; // (b - a) scales the result to the range, then add a to shift the range
    },

    // Generates a random value that follows a roughly normal distribution (bell curve)
    rand_normalish: function() {
      // Sum of four random numbers divided by 4 to normalize the value between -1 and 1
      const r = Math.random() + Math.random() + Math.random() + Math.random();
      return (r / 4.0) * 2.0 - 1; // Normalize and scale to be in the range [-1, 1]
    },

    // Generates a random integer between a and b (inclusive)
    rand_int: function(a, b) {
      return Math.round(Math.random() * (b - a) + a); // Round the result to get an integer
    },

    // Linear interpolation (lerp) between a and b using a parameter x
    lerp: function(x, a, b) {
      return x * (b - a) + a; // Interpolate linearly between a and b based on x
    },

    // Smoothstep interpolation (smooth transition) between a and b, easing at both ends
    smoothstep: function(x, a, b) {
      x = x * x * (3.0 - 2.0 * x); // Smoothstep function for easing, squaring the value
      return x * (b - a) + a; // Apply interpolation between a and b
    },

    // Smootherstep interpolation (even smoother transition) between a and b
    smootherstep: function(x, a, b) {
      x = x * x * x * (x * (x * 6 - 15) + 10); // Smootherstep function for even smoother easing
      return x * (b - a) + a; // Apply interpolation between a and b
    },

    // Clamps the value x between the bounds a and b
    clamp: function(x, a, b) {
      return Math.min(Math.max(x, a), b); // Ensures x stays within the range [a, b]
    },

    // Saturates the value x, ensuring it stays between 0 and 1
    sat: function(x) {
      return Math.min(Math.max(x, 0.0), 1.0); // Ensures x stays in the range [0, 1]
    },

    // Checks if x is within the range [a, b] (inclusive)
    in_range: (x, a, b) => {
      return x >= a && x <= b; // Returns true if x is between a and b
    },
  };
})();
