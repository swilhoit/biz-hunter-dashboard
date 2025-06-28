// Simple runner for testing refactored scrapers
import { testRefactoredScrapers } from './refactored-scrapers-test';

// Execute the test
testRefactoredScrapers()
  .then(() => {
    console.log('Test execution complete');
  })
  .catch(err => {
    console.error('Test execution failed:', err);
  });
