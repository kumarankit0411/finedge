const RULES = {
    food: ['starbucks', 'cafe', 'restaurant', 'grocery'],
    transport: ['uber', 'ola', 'fuel', 'petrol', 'metro'],
    subscription: ['netflix', 'spotify', 'prime', 'youtube'],
    utilities: ['electricity', 'water', 'internet', 'bill'],
    shopping: ['amazon', 'flipkart', 'zara', 'myntra'],
};
  
const categorizeTransaction = (description) => {
    if (!description) return 'other';
  
    const text = description.toLowerCase();
  
    const found = Object.entries(RULES).find(([category, keywords]) =>
      keywords.some(keyword => text.includes(keyword))
    );
  
    return found ? found[0] : 'other';
};
  
module.exports = { categorizeTransaction };