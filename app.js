// Personal Finance Tracker Application
class FinanceTracker {
    constructor() {
        this.currentUser = null;
        this.users = [
            {
                id: 1,
                username: "admin",
                password: "password123",
                email: "admin@example.com"
            }
        ];
        this.transactions = [
            {
                id: 1,
                user_id: 1,
                amount: 45.99,
                category: "Food",
                description: "Grocery shopping",
                transaction_type: "expense",
                date: "2024-12-01",
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                user_id: 1,
                amount: 2500.00,
                category: "Income",
                description: "Monthly salary",
                transaction_type: "income",
                date: "2024-12-01",
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                user_id: 1,
                amount: 1200.00,
                category: "Housing",
                description: "Rent payment",
                transaction_type: "expense",
                date: "2024-12-01",
                created_at: new Date().toISOString()
            }
        ];
        this.budgets = [
            { id: 1, user_id: 1, category: "Food", amount: 400, month: "2024-12" },
            { id: 2, user_id: 1, category: "Transportation", amount: 200, month: "2024-12" },
            { id: 3, user_id: 1, category: "Housing", amount: 1200, month: "2024-12" },
            { id: 4, user_id: 1, category: "Entertainment", amount: 150, month: "2024-12" },
            { id: 5, user_id: 1, category: "Healthcare", amount: 100, month: "2024-12" },
            { id: 6, user_id: 1, category: "Shopping", amount: 250, month: "2024-12" }
        ];
        this.currentPage = 'login';
        this.editingTransaction = null;
        this.expenseChart = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.showPage('login');
    }

    bindEvents() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        
        // Navigation
        document.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => this.navigateToPage(e.target.dataset.page));
        });
        
        // Logout buttons
        document.querySelectorAll('[id^="logout-btn"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleLogout());
        });
        
        // Transaction management
        document.getElementById('add-transaction-btn').addEventListener('click', () => this.showTransactionForm());
        document.getElementById('transaction-form').addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        document.getElementById('cancel-transaction').addEventListener('click', () => this.hideTransactionForm());
        
        // Budget management
        document.getElementById('budget-form').addEventListener('submit', (e) => this.handleBudgetSubmit(e));
        
        // Set default date for transaction form
        document.getElementById('trans-date').value = new Date().toISOString().split('T')[0];
    }

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            this.showPage('dashboard');
            this.updateDashboard();
        } else {
            this.showError('login-error', 'Invalid username or password');
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.showPage('login');
        document.getElementById('login-form').reset();
        this.hideError('login-error');
    }

    navigateToPage(page) {
        if (!this.currentUser && page !== 'login') return;
        
        this.showPage(page);
        
        switch(page) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'transactions':
                this.updateTransactionsList();
                break;
            case 'budgets':
                this.updateBudgetOverview();
                break;
        }
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId + '-page').classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelectorAll(`[data-page="${pageId}"]`).forEach(link => link.classList.add('active'));
        
        this.currentPage = pageId;
    }

    updateDashboard() {
        if (!this.currentUser) return;
        
        const userTransactions = this.getUserTransactions();
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyTransactions = userTransactions.filter(t => t.date.startsWith(currentMonth));
        
        // Calculate totals
        const totalIncome = monthlyTransactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = monthlyTransactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const currentBalance = totalIncome - totalExpenses;
        
        // Update summary cards
        document.getElementById('current-balance').textContent = this.formatCurrency(currentBalance);
        document.getElementById('monthly-income').textContent = this.formatCurrency(totalIncome);
        document.getElementById('monthly-expenses').textContent = this.formatCurrency(totalExpenses);
        
        // Update charts
        this.updateExpenseChart(monthlyTransactions);
        this.updateRecentTransactions(userTransactions.slice(-5).reverse());
    }

    updateExpenseChart(transactions) {
        const expenseTransactions = transactions.filter(t => t.transaction_type === 'expense');
        const categoryTotals = {};
        
        expenseTransactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });
        
        const ctx = document.getElementById('expense-chart').getContext('2d');
        
        if (this.expenseChart) {
            this.expenseChart.destroy();
        }
        
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325'];
        
        this.expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: colors.slice(0, Object.keys(categoryTotals).length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    updateRecentTransactions(transactions) {
        const container = document.getElementById('recent-transactions');
        
        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No transactions yet</p></div>';
            return;
        }
        
        container.innerHTML = transactions.map(t => `
            <div class="recent-transaction">
                <div class="recent-transaction-info">
                    <div class="recent-transaction-description">${t.description || 'No description'}</div>
                    <div class="recent-transaction-category">${t.category} • ${this.formatDate(t.date)}</div>
                </div>
                <div class="recent-transaction-amount ${t.transaction_type}">
                    ${t.transaction_type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                </div>
            </div>
        `).join('');
    }

    showTransactionForm(transaction = null) {
        this.editingTransaction = transaction;
        const wrapper = document.getElementById('transaction-form-wrapper');
        const form = document.getElementById('transaction-form');
        const title = document.getElementById('form-title');
        
        if (transaction) {
            title.textContent = 'Edit Transaction';
            document.getElementById('trans-amount').value = transaction.amount;
            document.getElementById('trans-type').value = transaction.transaction_type;
            document.getElementById('trans-category').value = transaction.category;
            document.getElementById('trans-date').value = transaction.date;
            document.getElementById('trans-description').value = transaction.description || '';
        } else {
            title.textContent = 'Add Transaction';
            form.reset();
            document.getElementById('trans-date').value = new Date().toISOString().split('T')[0];
        }
        
        wrapper.classList.remove('hidden');
    }

    hideTransactionForm() {
        document.getElementById('transaction-form-wrapper').classList.add('hidden');
        document.getElementById('transaction-form').reset();
        this.editingTransaction = null;
    }

    handleTransactionSubmit(e) {
        e.preventDefault();
        
        const formData = {
            amount: parseFloat(document.getElementById('trans-amount').value),
            transaction_type: document.getElementById('trans-type').value,
            category: document.getElementById('trans-category').value,
            date: document.getElementById('trans-date').value,
            description: document.getElementById('trans-description').value
        };
        
        if (this.editingTransaction) {
            // Update existing transaction
            const index = this.transactions.findIndex(t => t.id === this.editingTransaction.id);
            this.transactions[index] = { ...this.editingTransaction, ...formData };
        } else {
            // Add new transaction
            const newTransaction = {
                id: Math.max(...this.transactions.map(t => t.id), 0) + 1,
                user_id: this.currentUser.id,
                ...formData,
                created_at: new Date().toISOString()
            };
            this.transactions.push(newTransaction);
        }
        
        this.hideTransactionForm();
        this.updateTransactionsList();
        
        if (this.currentPage === 'dashboard') {
            this.updateDashboard();
        }
    }

    updateTransactionsList() {
        const transactions = this.getUserTransactions().reverse();
        const container = document.getElementById('transactions-list');
        
        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><h4>No transactions yet</h4><p>Add your first transaction to get started</p></div>';
            return;
        }
        
        container.innerHTML = transactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-amount ${t.transaction_type}">
                        ${t.transaction_type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                    </div>
                    <div class="transaction-meta">
                        ${t.description || 'No description'} • ${t.category} • ${this.formatDate(t.date)}
                    </div>
                </div>
                <div class="transaction-actions">
                    <button class="btn btn--secondary btn--xs" onclick="app.showTransactionForm(${JSON.stringify(t).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn btn--outline btn--xs" onclick="app.deleteTransaction(${t.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.updateTransactionsList();
            
            if (this.currentPage === 'dashboard') {
                this.updateDashboard();
            }
        }
    }

    handleBudgetSubmit(e) {
        e.preventDefault();
        
        const category = document.getElementById('budget-category').value;
        const amount = parseFloat(document.getElementById('budget-amount').value);
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        const existingBudget = this.budgets.find(b => 
            b.user_id === this.currentUser.id && 
            b.category === category && 
            b.month === currentMonth
        );
        
        if (existingBudget) {
            existingBudget.amount = amount;
        } else {
            const newBudget = {
                id: Math.max(...this.budgets.map(b => b.id), 0) + 1,
                user_id: this.currentUser.id,
                category,
                amount,
                month: currentMonth
            };
            this.budgets.push(newBudget);
        }
        
        document.getElementById('budget-form').reset();
        this.updateBudgetOverview();
    }

    updateBudgetOverview() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const userBudgets = this.budgets.filter(b => 
            b.user_id === this.currentUser.id && b.month === currentMonth
        );
        const userTransactions = this.getUserTransactions();
        const monthlyExpenses = userTransactions.filter(t => 
            t.transaction_type === 'expense' && t.date.startsWith(currentMonth)
        );
        
        const container = document.getElementById('budget-overview');
        
        if (userBudgets.length === 0) {
            container.innerHTML = '<div class="empty-state"><h4>No budgets set</h4><p>Set your first budget to start tracking your spending</p></div>';
            return;
        }
        
        container.innerHTML = userBudgets.map(budget => {
            const spent = monthlyExpenses
                .filter(t => t.category === budget.category)
                .reduce((sum, t) => sum + t.amount, 0);
            
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const isOverBudget = percentage > 100;
            
            return `
                <div class="budget-item">
                    <div class="budget-info">
                        <h5>${budget.category}</h5>
                        <div class="budget-amounts">
                            Spent: ${this.formatCurrency(spent)} of ${this.formatCurrency(budget.amount)}
                        </div>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar">
                            <div class="progress-fill ${isOverBudget ? 'over-budget' : ''}" 
                                 style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                    </div>
                    <div class="budget-percentage ${isOverBudget ? 'over-budget' : ''}">
                        ${Math.round(percentage)}%
                    </div>
                </div>
            `;
        }).join('');
    }

    getUserTransactions() {
        return this.transactions.filter(t => t.user_id === this.currentUser.id);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        errorElement.classList.add('hidden');
    }
}

// Initialize the application
const app = new FinanceTracker();