export const getBKKDate = () => {
    const date = new Date();
    const bkkDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    return bkkDate;
};

export const getBKKDateString = () => {
    const date = new Date();
    // format to YYYY-MM-DD in Bangkok time
    const options = { timeZone: "Asia/Bangkok", year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA gives YYYY-MM-DD
    return formatter.format(date);
};
