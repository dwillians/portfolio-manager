const form = document.getElementById('add-asset-form');
const tableBody = document.querySelector('#portfolio-table tbody');
const totalValueEl = document.getElementById('total-value');
const refreshBtn = document.getElementById('refresh-prices');
const exportBtn = document.getElementById('export-csv');
const chartCanvas = document.getElementById('portfolio-chart');
let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
let totalValue = 0;
let chart; // Variabel untuk Chart.js

// Fungsi untuk mendapatkan harga dari API
async function getPrice(type, name) {
    if (type === 'stock') {
        const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${name}&apikey=YOUR_API_KEY`);
        const data = await response.json();
        return parseFloat(data['Global Quote']['05. price']) || 0;
    } else if (type === 'crypto') {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${name.toLowerCase()}&vs_currencies=usd`);
        const data = await response.json();
        return data[name.toLowerCase()]?.usd || 0;
    }
    return 1; // Cash default to 1
}

// Render tabel dan grafik
async function renderPortfolio() {
    tableBody.innerHTML = '';
    totalValue = 0;
    const labels = [];
    const data = [];

    for (const asset of portfolio) {
        const price = await getPrice(asset.type, asset.name);
        const value = asset.quantity * price;
        totalValue += value;
        labels.push(`${asset.name} (${asset.type})`);
        data.push(value);

        tableBody.innerHTML += `
            <tr>
                <td>${asset.type}</td>
                <td>${asset.name}</td>
                <td>${asset.quantity}</td>
                <td>$${price.toFixed(2)}</td>
                <td>$${value.toFixed(2)}</td>
            </tr>
        `;
    }
    totalValueEl.textContent = `$${totalValue.toFixed(2)}`;

    // Update grafik
    if (chart) chart.destroy();
    chart = new Chart(chartCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribusi Portofolio' }
            }
        }
    });
}

// Tambah aset
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('asset-type').value;
    const name = document.getElementById('asset-name').value;
    const quantity = parseFloat(document.getElementById('asset-quantity').value);
    portfolio.push({ type, name, quantity });
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    renderPortfolio();
    form.reset();
});

// Refresh harga
refreshBtn.addEventListener('click', renderPortfolio);

// Ekspor ke CSV
exportBtn.addEventListener('click', () => {
    let csv = 'Tipe,Nama,Jumlah,Harga Saat Ini,Nilai Total\n';
    portfolio.forEach(async (asset) => {
        const price = await getPrice(asset.type, asset.name);
        const value = asset.quantity * price;
        csv += `${asset.type},${asset.name},${asset.quantity},${price.toFixed(2)},${value.toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio.csv';
    a.click();
    URL.revokeObjectURL(url);
});

// Load awal
renderPortfolio();