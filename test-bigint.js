const maxBigInt = 9223372036854775807;
const testValue = 9223372036854776000;
const safeBigInt = (value) => {
  if (!isFinite(value) || isNaN(value)) return 0;
  return Math.min(Math.max(Math.floor(value), 0), maxBigInt);
};
console.log('Test value:', testValue);
console.log('Max bigint:', maxBigInt);
console.log('Safe value:', safeBigInt(testValue));
console.log('Should cap to max:', safeBigInt(testValue) === maxBigInt);