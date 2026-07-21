import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Gamepad2, User, Settings, LogOut, PlusCircle, Monitor } from 'lucide-react';
import { resolveDashboardRole } from './auth';

type InventoryItem = {
  id: number;
  name: string;
  price: string;
  stock: number;
  rented: number;
};

type OrderItem = {
  id: number;
  itemId: number;
  itemName: string;
  customerName: string;
  duration: string;
  createdAt: string;
  status: 'Pending' | 'Confirmed' | 'Rejected';
};

type InventoryContextValue = {
  inventory: InventoryItem[];
  orders: OrderItem[];
  adjustStock: (id: number, delta: number) => void;
  createOrder: (itemId: number, customerName: string, duration: string) => boolean;
  updateOrderStatus: (orderId: number, status: OrderItem['status']) => void;
};

const INVENTORY_STORAGE_KEY = 'ps-rental-inventory';
const ORDERS_STORAGE_KEY = 'ps-rental-orders';
const initialInventory: InventoryItem[] = [
  { id: 1, name: 'PlayStation 5', price: 'Rp 150.000 / Hari', stock: 5, rented: 2 },
  { id: 2, name: 'PlayStation 4 Pro', price: 'Rp 100.000 / Hari', stock: 3, rented: 1 },
];

const InventoryContext = React.createContext<InventoryContextValue | undefined>(undefined);

function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    if (typeof window === 'undefined') {
      return initialInventory;
    }

    try {
      const stored = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as InventoryItem[];
        }
      }
    } catch {
      // Fallback to default inventory if storage data is invalid.
    }

    return initialInventory;
  });
  const [orders, setOrders] = useState<OrderItem[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed as OrderItem[];
        }
      }
    } catch {
      // Fallback to empty orders if storage data is invalid.
    }

    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    }
  }, [inventory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders]);

  const adjustStock = (id: number, delta: number) => {
    setInventory((current) =>
      current.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item,
      ),
    );
  };

  const createOrder = (itemId: number, customerName: string, duration: string) => {
    const selectedItem = inventory.find((item) => item.id === itemId);

    if (!selectedItem || selectedItem.stock <= 0) {
      return false;
    }

    setInventory((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, stock: item.stock - 1, rented: item.rented + 1 }
          : item,
      ),
    );

    setOrders((current) => [
      {
        id: Date.now(),
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        customerName: customerName.trim() || 'Guest',
        duration: duration.trim() || '1 Hari',
        createdAt: new Date().toLocaleString('id-ID'),
        status: 'Pending',
      },
      ...current,
    ]);

    return true;
  };

  const updateOrderStatus = (orderId: number, status: OrderItem['status']) => {
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order)),
    );
  };

  return (
    <InventoryContext.Provider value={{ inventory, orders, adjustStock, createOrder, updateOrderStatus }}>
      {children}
    </InventoryContext.Provider>
  );
}

function useInventory() {
  const context = React.useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground text-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0 pointer-events-none"></div>
      
      <div className="z-10 max-w-3xl flex flex-col items-center">
        <Gamepad2 className="w-24 h-24 text-primary mb-8" />
        <h1 className="text-5xl font-bold tracking-tight mb-6">Level Up Your Weekend.</h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-xl">
          Sewa konsol PlayStation terbaru dengan mudah. Pesan sekarang dan mainkan game favorit Anda tanpa ribet.
        </p>
        
        <div className="flex gap-4">
          <Link to="/login" className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:bg-accent transition-colors">
            Login Sekarang
          </Link>
          <Link to="/login" className="px-8 py-4 bg-secondary text-secondary-foreground rounded-full font-medium hover:bg-muted transition-colors">
            Buat Akun
          </Link>
        </div>
      </div>
    </div>
  );
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const role = resolveDashboardRole(username, password);

    if (role === 'admin') {
      setErrorMessage('');
      navigate('/admin');
      return;
    }

    if (role === 'user') {
      setErrorMessage('');
      navigate('/user');
      return;
    }

    setErrorMessage('Username atau password salah. Coba admin/admin atau user/user.');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <Gamepad2 className="w-6 h-6" />
        <span className="font-bold tracking-widest uppercase text-sm">PS Rental</span>
      </Link>

      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold mb-2">Masuk</h2>
        <p className="text-muted-foreground mb-8">Masukan kredensial Anda untuk melanjutkan.</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="user atau admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Password..."
              required
            />
            <p className="text-xs text-muted-foreground mt-2">Hint: ketik "admin" untuk masuk sebagai admin, lainnya sebagai user.</p>
          </div>
          
          {errorMessage ? (
            <p className="text-sm text-red-400">{errorMessage}</p>
          ) : null}

          <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium mt-4 hover:bg-accent transition-colors">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 bg-primary rounded-lg">
            <Settings className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">Admin Panel</span>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-lg text-foreground">
            <Monitor className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-secondary/50 rounded-lg hover:text-foreground">
            <User className="w-5 h-5" />
            <span>Users</span>
          </Link>
        </nav>

        <button onClick={() => navigate('/')} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-auto">
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </aside>
      
      {/* Content */}
      <main className="flex-1 p-12 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function AdminDashboard() {
  const { inventory, orders, adjustStock, updateOrderStatus } = useInventory();

  const totalAvailable = inventory.reduce((sum, item) => sum + item.stock, 0);
  const totalRented = inventory.reduce((sum, item) => sum + item.rented, 0);
  const pendingOrders = orders.filter((order) => order.status === 'Pending').length;

  return (
    <AdminLayout>
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Dashboard Admin</h1>
        <p className="text-muted-foreground">Ringkasan penyewaan dan status konsol.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h3 className="text-muted-foreground text-sm font-medium mb-4">Pesanan Menunggu</h3>
          <p className="text-4xl font-bold">{pendingOrders}</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h3 className="text-muted-foreground text-sm font-medium mb-4">Unit Tersedia</h3>
          <p className="text-4xl font-bold">{totalAvailable} <span className="text-lg font-normal text-muted-foreground">/ {totalAvailable + totalRented}</span></p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h3 className="text-muted-foreground text-sm font-medium mb-4">Pendapatan Hari Ini</h3>
          <p className="text-4xl font-bold">Rp 450k</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Kelola Unit Sewa</h2>
        </div>
        <div className="p-6 space-y-4">
          {inventory.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustStock(item.id, -1)}
                  className="h-9 w-9 rounded-full border border-border text-lg transition hover:bg-secondary"
                  aria-label={`Kurangi unit ${item.name}`}
                >
                  −
                </button>
                <div className="min-w-14 text-center font-semibold">{item.stock}</div>
                <button
                  onClick={() => adjustStock(item.id, 1)}
                  className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-lg transition hover:bg-accent"
                  aria-label={`Tambah unit ${item.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Pesanan Terbaru</h2>
        </div>
        <div className="p-6">
          {orders.length === 0 ? (
            <p className="text-muted-foreground">Tidak ada pesanan baru saat ini.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{order.itemName}</p>
                      <p className="text-sm text-muted-foreground">{order.customerName} • {order.duration}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm ${order.status === 'Confirmed' ? 'bg-green-500/10 text-green-500' : order.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{order.createdAt}</p>
                  {order.status === 'Pending' ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Confirmed')}
                        className="rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                      >
                        Konfirmasi
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Rejected')}
                        className="rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
                      >
                        Tolak
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function UserLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-primary" />
          <span className="font-bold tracking-widest uppercase">PS Rental</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Hi, User</span>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-red-500 hover:text-red-400">
            Keluar
          </button>
        </div>
      </header>
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

function UserDashboard() {
  const { inventory, orders, createOrder } = useInventory();
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number>(inventory[0]?.id ?? 1);
  const [customerName, setCustomerName] = useState('');
  const [duration, setDuration] = useState('1 Hari');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const openOrderForm = (itemId: number) => {
    setSelectedItemId(itemId);
    setIsOrderOpen(true);
    setFeedbackMessage('');
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const success = createOrder(selectedItemId, customerName, duration);

    if (!success) {
      setFeedbackMessage('Unit ini sedang habis, silakan pilih unit lain.');
      return;
    }

    setFeedbackMessage(`Pesanan untuk ${inventory.find((item) => item.id === selectedItemId)?.name ?? 'unit'} berhasil dikirim ke admin untuk dikonfirmasi.`);
    setCustomerName('');
    setDuration('1 Hari');
    setIsOrderOpen(false);
  };

  return (
    <UserLayout>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Pesan PS Sekarang</h1>
          <p className="text-muted-foreground">Pilih konsol dan paket yang sesuai dengan kebutuhan Anda.</p>
        </div>
        <button
          onClick={() => openOrderForm(inventory[0]?.id ?? 1)}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-accent transition-colors flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Buat Pesanan
        </button>
      </div>

      {feedbackMessage ? (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
          {feedbackMessage}
        </div>
      ) : null}

      {isOrderOpen ? (
        <form onSubmit={handleCreateOrder} className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Form Pesanan</h2>
            <p className="text-sm text-muted-foreground">Isi data berikut untuk membuat pesanan unit.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Unit</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-3"
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Durasi Sewa</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-3"
              >
                <option value="1 Hari">1 Hari</option>
                <option value="2 Hari">2 Hari</option>
                <option value="3 Hari">3 Hari</option>
                <option value="1 Minggu">1 Minggu</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium">Nama Pelanggan</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-3"
              placeholder="Contoh: Raka"
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" className="rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-accent">
              Konfirmasi Pesanan
            </button>
            <button
              type="button"
              onClick={() => setIsOrderOpen(false)}
              className="rounded-full border border-border px-5 py-3 font-medium hover:bg-secondary"
            >
              Batal
            </button>
          </div>
        </form>
      ) : null}

      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">Pesanan Saya</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pesanan Anda akan muncul di dashboard admin untuk dikonfirmasi.</p>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Belum ada pesanan yang dibuat.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {orders.map((order) => (
              <li key={order.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{order.itemName} • {order.customerName}</span>
                <span className={`rounded-full px-2 py-1 text-xs ${order.status === 'Confirmed' ? 'bg-green-500/10 text-green-500' : order.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                  {order.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map((item) => {
          const isAvailable = item.stock > 0;
          const status = isAvailable ? 'Tersedia' : 'Tidak Tersedia';
          const imageSrc = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
              <rect width="800" height="500" rx="32" fill="${item.name.includes('5') ? '#00439c' : '#0070cc'}"/>
              <rect x="80" y="80" width="640" height="340" rx="24" fill="rgba(255,255,255,0.18)"/>
              <circle cx="260" cy="260" r="90" fill="rgba(255,255,255,0.9)"/>
              <rect x="390" y="180" width="210" height="140" rx="16" fill="rgba(255,255,255,0.9)"/>
              <text x="400" y="245" fill="#0f172a" font-size="34" font-family="Arial, sans-serif">${item.name}</text>
            </svg>
          `)}`;

          return (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col">
              <div className="mb-6 overflow-hidden rounded-lg bg-secondary">
                <img src={imageSrc} alt={item.name} className="h-40 w-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-1">{item.name}</h3>
              <p className="text-primary font-medium mb-4">{item.price}</p>
              <p className="text-sm text-muted-foreground mb-4">Stok: {item.stock} unit</p>

              <div className="mt-auto flex items-center justify-between">
                <span className={`text-sm px-3 py-1 rounded-full ${isAvailable ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {status}
                </span>
                {isAvailable ? (
                  <button
                    onClick={() => openOrderForm(item.id)}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    Pesan
                  </button>
                ) : (
                  <span className="text-sm text-muted-foreground">Habis</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </UserLayout>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/user" element={<UserDashboard />} />
        </Routes>
      </Router>
    </InventoryProvider>
  );
}
