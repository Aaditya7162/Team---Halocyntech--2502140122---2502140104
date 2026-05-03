var appName = "Nexus CRM";
let totalSalesCount = 0;
const isAppRunning = true;

let salesData = [];

const currentUser = {
    username: "",
    isLoggedIn: false
};

function demonstrateEquality() {
    let num = 5;
    let str = "5";
    
    if (num == str) {
        console.log("== True: 5 equals '5' in value.");
    }
    
    if (num === str) {
        console.log("=== True");
    } else {
        console.log("=== False: 5 (number) is not exactly equal to '5' (string).");
    }
}
demonstrateEquality();


const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:8080" 
    : "https://your-backend-url.onrender.com"; // Replace with your backend live link
const API_URL = `${API_BASE}/sales`;

function showDashboard() {
    document.getElementById("login-page").style.display = "none";
    document.getElementById("dashboard-page").style.display = "flex";
    fetchSales();
}

function logout() {
    currentUser.username = "";
    currentUser.isLoggedIn = false;
    localStorage.removeItem("crm_isLoggedIn");
    localStorage.removeItem("crm_username");
    document.getElementById("dashboard-page").style.display = "none";
    document.getElementById("login-page").style.display = "block";
    
    const inputs = document.getElementsByTagName("input");
    for(let i = 0; i < inputs.length; i++) {
        inputs[i].value = "";
    }
}

const submitHandler = async (event) => {
    event.preventDefault();
    
    const userField = document.getElementById("username").value;
    const passField = document.getElementById("password").value;
    const errorMsg = document.getElementById("login-error");
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: userField, password: passField })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.username = userField;
            currentUser.isLoggedIn = true;
            localStorage.setItem("crm_isLoggedIn", "true");
            localStorage.setItem("crm_username", userField);
            errorMsg.innerText = "";
            document.getElementById("display-username").innerText = userField;
            showDashboard();
        } else {
            errorMsg.innerText = data.error;
            errorMsg.style.color = "red"; 
        }
    } catch (error) {
        errorMsg.innerText = "Server error. Please ensure Flask backend is running.";
    }
};

const fetchSales = async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        // Sort sales by date and ID descending so recent transactions show at the top
        salesData = data.sort((a, b) => {
            let dateA = new Date(a.date);
            let dateB = new Date(b.date);
            if (dateB - dateA !== 0) {
                return dateB - dateA;
            }
            return b.id - a.id;
        });
        renderSales();
    } catch (error) {
        console.error(error);
    }
};

const renderSales = () => {
    const listContainer = document.getElementById("sales-list");
    listContainer.innerHTML = "";
    
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    const filterValue = document.getElementById("filter-select").value;
    
    let totalRevenue = 0;
    let visibleSalesCount = 0;

    for (let i = 0; i < salesData.length; i++) {
        let sale = salesData[i];
        
        if (searchTerm && !sale.product.toLowerCase().includes(searchTerm)) {
            continue;
        }
        
        if (filterValue === "high" && sale.amount <= 50000) {
            continue;
        } else if (filterValue === "low" && sale.amount > 50000) {
            continue;
        }
        
        totalRevenue += sale.amount;
        visibleSalesCount++;

        let saleDiv = document.createElement("div");
        saleDiv.className = "sale-item";
        
        saleDiv.innerHTML = `
            <span>${sale.product}</span>
            <span class="amount">₹${sale.amount.toLocaleString('en-IN')}</span>
            <span>${sale.date}</span>
            <div class="sale-actions">
                <button class="btn btn-secondary btn-small" onclick="editSale('${sale.id}')"><i class="ph ph-pencil-simple"></i> Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteSale('${sale.id}')"><i class="ph ph-trash"></i> Delete</button>
            </div>
        `;
        
        listContainer.appendChild(saleDiv);
    }

    document.getElementById("total-revenue").innerText = "₹" + totalRevenue.toLocaleString('en-IN');
    document.getElementById("total-sales-count").innerText = visibleSalesCount;
    
    let avg = visibleSalesCount > 0 ? (totalRevenue / visibleSalesCount) : 0;
    document.getElementById("avg-deal-size").innerText = "₹" + Math.round(avg).toLocaleString('en-IN');
};

async function saveSale(event) {
    event.preventDefault();
    
    const id = document.getElementById("sale-id").value;
    const product = document.getElementById("product").value;
    const amount = document.getElementById("amount").value;
    const date = document.getElementById("date").value;
    const errorMsg = document.getElementById("form-error");
    
    if (!product || product.trim() === "") {
        errorMsg.innerText = "Product name is required.";
        errorMsg.style.display = "block";
        return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        errorMsg.innerText = "Amount must be a positive number.";
        errorMsg.style.display = "block";
        return;
    }
    if (!date) {
        errorMsg.innerText = "Date is required.";
        errorMsg.style.display = "block";
        return;
    }
    
    errorMsg.style.display = "none";
    
    const payload = { product, amount, date };
    
    try {
        let response;
        if (id) {
            response = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }
        
        if (response.ok) {
            document.getElementById("sale-form").reset();
            document.getElementById("sale-id").value = "";
            document.getElementById("form-title").innerText = "Add New Sale";
            document.getElementById("cancel-btn").style.display = "none";
            document.getElementById("save-btn").innerText = "Add Sale";
            
            const formCards = document.getElementsByClassName("form-section");
            if(formCards.length > 0) {
                formCards[0].style.backgroundColor = "rgba(75, 181, 67, 0.1)";
                setTimeout(() => {
                    formCards[0].style.backgroundColor = "";
                }, 1000);
            }
            
            fetchSales();
        }
    } catch (error) {
        console.error(error);
    }
}

function editSale(id) {
    let saleToEdit = null;
    for(let i=0; i<salesData.length; i++) {
        if(salesData[i].id == id) {
            saleToEdit = salesData[i];
            break;
        }
    }
    
    if (saleToEdit) {
        document.getElementById("sale-id").value = saleToEdit.id;
        document.getElementById("product").value = saleToEdit.product;
        document.getElementById("amount").value = saleToEdit.amount;
        document.getElementById("date").value = saleToEdit.date;
        
        document.getElementById("form-title").innerText = "Update Sale";
        document.getElementById("save-btn").innerText = "Update Sale";
        document.getElementById("cancel-btn").style.display = "inline-block";
    }
}

function cancelEdit(event) {
    document.getElementById("sale-form").reset();
    document.getElementById("sale-id").value = "";
    document.getElementById("form-title").innerText = "Add New Sale";
    document.getElementById("save-btn").innerText = "Add Sale";
    document.getElementById("cancel-btn").style.display = "none";
}

async function deleteSale(id) {
    if(confirm("Are you sure you want to delete this sale?")) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });
            
            if (response.ok || response.status === 204) {
                fetchSales();
            }
        } catch (error) {
            console.error(error);
        }
    }
}

function searchHandler(event) {
    renderSales();
}

function filterHandler(event) {
    renderSales();
}

function switchTab(tabName, element) {
    
    const navItems = document.getElementsByClassName("nav-item");
    for(let i=0; i<navItems.length; i++) {
        navItems[i].className = "nav-item";
    }
    
    for(let i=0; i<navItems.length; i++) {
        if(navItems[i].getAttribute("onclick") && navItems[i].getAttribute("onclick").includes(`'${tabName}'`)) {
            navItems[i].className = "nav-item active";
        }
    }

    document.getElementById("tab-dashboard").style.display = "none";
    document.getElementById("tab-placeholder").style.display = "none";
    if (document.getElementById("tab-settings")) {
        document.getElementById("tab-settings").style.display = "none";
    }

    if (tabName === "dashboard") {
        document.getElementById("tab-dashboard").style.display = "block";
    } else if (tabName === "Settings") {
        if (document.getElementById("tab-settings")) {
            document.getElementById("tab-settings").style.display = "block";
        }
    } else {
        document.getElementById("tab-placeholder").style.display = "block";
        document.getElementById("placeholder-title").innerText = tabName;
    }
}

function toggleTheme(theme) {
    if (theme === "light") {
        document.body.classList.add("light-mode");
    } else {
        document.body.classList.remove("light-mode");
    }
    localStorage.setItem("crm_theme", theme);
}

function changeLanguage(lang) {
    localStorage.setItem("crm_lang", lang);
    const mainTitle = document.querySelector(".top-header h2");
    if (mainTitle) {
        if (lang === "es") mainTitle.innerText = "Resumen de Ventas";
        else if (lang === "fr") mainTitle.innerText = "Aperçu des Ventes";
        else if (lang === "hi") mainTitle.innerText = "बिक्री अवलोकन";
        else mainTitle.innerText = "Sales Overview";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("crm_theme") || "dark";
    toggleTheme(savedTheme);
    const themeSelect = document.getElementById("theme-select");
    if(themeSelect) themeSelect.value = savedTheme;
    
    const savedLang = localStorage.getItem("crm_lang") || "en";
    changeLanguage(savedLang);
    const langSelect = document.getElementById("lang-select");
    if(langSelect) langSelect.value = savedLang;

    const savedLogin = localStorage.getItem("crm_isLoggedIn");
    const savedUser = localStorage.getItem("crm_username");
    
    if (savedLogin === "true" && savedUser) {
        currentUser.username = savedUser;
        currentUser.isLoggedIn = true;
        document.getElementById("display-username").innerText = savedUser;
        showDashboard();
    }
});
