import { calculatePaymentSplit, getPaymentBreakdown } from "./paymentSplit.js";

// Test cases for payment splitting
console.log("\n=== Payment Splitting Tests ===\n");

// Test 1: Basic split with 15% commission
console.log(
  "Test 1: Basic split (productsTotal: ₪100, deliveryFee: ₪0, tipAmount: ₪0, commission: 15%)"
);
const test1 = calculatePaymentSplit(100, 0, 0, 0.15);
console.log(test1);
console.assert(test1.platformFee === 15, "Platform fee should be 15");
console.assert(test1.storePayout === 85, "Store payout should be 85");
console.assert(test1.courierPayout === 0, "Courier payout should be 0");
console.assert(test1.totalPrice === 100, "Total price should be 100");

// Test 2: Split with delivery fee
console.log(
  "\nTest 2: With delivery fee (productsTotal: ₪100, deliveryFee: ₪20, tipAmount: ₪0, commission: 15%)"
);
const test2 = calculatePaymentSplit(100, 20, 0, 0.15);
console.log(test2);
console.assert(test2.platformFee === 15, "Platform fee should be 15");
console.assert(test2.storePayout === 85, "Store payout should be 85");
console.assert(test2.courierPayout === 20, "Courier payout should be 20");
console.assert(test2.totalPrice === 120, "Total price should be 120");

// Test 3: With delivery fee and tip
console.log(
  "\nTest 3: With delivery and tip (productsTotal: ₪100, deliveryFee: ₪20, tipAmount: ₪5, commission: 15%)"
);
const test3 = calculatePaymentSplit(100, 20, 5, 0.15);
console.log(test3);
console.assert(test3.platformFee === 15, "Platform fee should be 15");
console.assert(test3.storePayout === 85, "Store payout should be 85");
console.assert(test3.courierPayout === 25, "Courier payout should be 25");
console.assert(test3.totalPrice === 125, "Total price should be 125");

// Test 4: Different commission rate (20%)
console.log(
  "\nTest 4: Different commission rate (20%) (productsTotal: ₪100, commission: 20%)"
);
const test4 = calculatePaymentSplit(100, 0, 0, 0.2);
console.log(test4);
console.assert(test4.platformFee === 20, "Platform fee should be 20");
console.assert(test4.storePayout === 80, "Store payout should be 80");

// Test 5: High value order
console.log(
  "\nTest 5: High value order (productsTotal: ₪500, deliveryFee: ₪50, tipAmount: ₪10, commission: 15%)"
);
const test5 = calculatePaymentSplit(500, 50, 10, 0.15);
console.log(test5);
console.assert(test5.platformFee === 75, "Platform fee should be 75");
console.assert(test5.storePayout === 425, "Store payout should be 425");
console.assert(test5.courierPayout === 60, "Courier payout should be 60");
console.assert(test5.totalPrice === 560, "Total price should be 560");

// Test 6: Detailed breakdown
console.log("\nTest 6: Detailed payment breakdown");
const test6 = getPaymentBreakdown(100, 20, 5, 0.15);
console.log(test6);
console.log("\nBreakdown:");
Object.entries(test6.breakdown).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

// Test 7: Edge case - no commission
console.log("\nTest 7: No commission (0%)");
const test7 = calculatePaymentSplit(100, 0, 0, 0);
console.log(test7);
console.assert(test7.platformFee === 0, "Platform fee should be 0");
console.assert(test7.storePayout === 100, "Store payout should be 100");

// Test 8: Verify sum equals total
console.log(
  "\nTest 8: Verify platformFee + storePayout + courierPayout = totalPrice"
);
const tests = [test1, test2, test3, test4, test5, test7];
tests.forEach((test, i) => {
  const sum = test.platformFee + test.storePayout + test.courierPayout;
  const diff = Math.abs(sum - test.totalPrice);
  console.assert(diff < 0.01, `Test ${i + 1}: Sum should equal total`);
  console.log(
    `  Test ${i + 1}: ✓ (${test.platformFee} + ${test.storePayout} + ${
      test.courierPayout
    } = ${test.totalPrice})`
  );
});

// Test 9: Error handling
console.log("\nTest 9: Error handling");
try {
  calculatePaymentSplit(-100, 0, 0, 0.15);
  console.assert(false, "Should throw error for negative products total");
} catch (err) {
  console.log("  ✓ Correctly throws error for negative products total");
}

try {
  calculatePaymentSplit(100, 0, 0, 1.5);
  console.assert(false, "Should throw error for commission > 1");
} catch (err) {
  console.log("  ✓ Correctly throws error for invalid commission rate");
}

try {
  calculatePaymentSplit(100, -10, 0, 0.15);
  console.assert(false, "Should throw error for negative delivery fee");
} catch (err) {
  console.log("  ✓ Correctly throws error for negative delivery fee");
}

console.log("\n=== All tests completed ===\n");
console.log("\n=== All tests completed ===\n");
