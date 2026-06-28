const $ = s => document.querySelector(s);

const salaryInput = $("#salary"),
      expenseName = $("#expense-name"),
      expenseAmount = $("#expense-amount"),
      totalSalary = $("#total-salary"),
      totalExpenses = $("#total-expenses"),
      balance = $("#balance"),
      expenseList = $("#expense-list"),
      emptyMessage = $("#empty-message"),
      warning = $("#warning"),
      currency = $("#currency");

let data = JSON.parse(localStorage.getItem("cash")) || {
  salary: 0,
  expenses: []
};

let chart;

const save = () =>
  localStorage.setItem("cash", JSON.stringify(data));

const calculateTotalExpenses = () =>
  data.expenses.reduce((total, expense) => total + expense.amount, 0);

function render() {
  let totalExpensesValue = calculateTotalExpenses(), left = data.salary - totalExpensesValue;

  totalSalary.textContent = data.salary;
  totalExpenses.textContent = totalExpensesValue;
  balance.textContent = left;

  expenseList.innerHTML = data.expenses.map(expense =>
    `<li>
      <span>${expense.name} - ₹${expense.amount}</span>
      <button onclick="removeExpense(${expense.id})">Delete</button>
    </li>`
  ).join("");

  emptyMessage.style.display =
    data.expenses.length ? "none" : "block";

  warning.textContent =
    left < data.salary * 0.1 && data.salary
      ? "Low balance warning" : "";

  chart?.destroy();
  chart = new Chart($("#expense-chart"), {
    type: "pie",
    data: {
      labels: ["Expenses", "Balance"],
      datasets: [{ data: [totalExpensesValue, left] }]
    }
  });

  save();
}

$("#salary-btn").onclick = () => {
  let enteredSalary = +salaryInput.value;
  if (enteredSalary <= 0) return alert("Enter valid salary");

  data.salary = enteredSalary;
  salaryInput.value = "";
  render();
};

$("#expense-btn").onclick = () => {
  let name = expenseName.value.trim(),
      amount = +expenseAmount.value;

  if (!name || amount <= 0)
    return alert("Enter valid expense");

  data.expenses.push({
    id: Date.now(),
    name,
    amount
  });

  expenseName.value = expenseAmount.value = "";
  render();
};

function removeExpense(id) {
  data.expenses = data.expenses.filter(expense => expense.id !== id);
  render();
}

currency.onchange = async () => {
  if (currency.value !== "USD")
    return alert("Showing INR");

  let response = await fetch(
    "https://api.frankfurter.app/latest?from=INR&to=USD"
  );

  let json = await response.json();
  alert(`1 INR = ${json.rates.USD} USD`);
};

$("#download-report").onclick = () => {
  let pdf = new window.jspdf.jsPDF(),
      totalExpensesValue = calculateTotalExpenses(),
      left = data.salary - totalExpensesValue;

  pdf.setFontSize(18);
  pdf.text("Cash Flow Report", 20, 20);

  pdf.setFontSize(12);
  pdf.text(`Salary : Rs ${data.salary}`, 20, 40);
  pdf.text(`Total Expenses : Rs ${totalExpensesValue}`, 20, 50);
  pdf.text(`Remaining Balance : Rs ${left}`, 20, 60);

  pdf.line(20, 70, 100, 70);

  pdf.text("Expense List", 20, 85);

  data.expenses.forEach((expense, index) =>
    pdf.text(
      `${expense.name}   - Rs ${expense.amount}`,
      20,
      100 + index * 10
    )
  );

  pdf.save("cash-report.pdf");
};

render();