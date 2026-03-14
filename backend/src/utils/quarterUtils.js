/**
 * Utility to determine the current academic/platform quarter
 * Q1: Jan - Mar
 * Q2: Apr - Jun
 * Q3: Jul - Sep
 * Q4: Oct - Dec
 */
exports.getCurrentQuarter = () => {
    const month = new Date().getMonth(); // 0-indexed: 0=Jan, 11=Dec
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
};
