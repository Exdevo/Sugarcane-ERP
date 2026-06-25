import React, { useState, useEffect } from "react";
import api from "./api";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
  Avatar,
  Divider
} from "@mui/material";

// Icons (since standard SVGs or emojis can be fallbacks if imports error, let's use direct text, symbols, or robust emojis styled beautifully to avoid potential build-time missing dependency issues with specific icon variants. Let's use clean layout symbols and emojis inside styled containers for absolute safety and elite styling!)

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#10b981", // Emerald
      light: "#34d399",
      dark: "#059669",
    },
    secondary: {
      main: "#3b82f6", // Blue
    },
    background: {
      default: "#090d16", // Deep black-slate
      paper: "#111827", // Dark card grey
    },
    text: {
      primary: "#f3f4f6",
      secondary: "#9ca3af",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.5px",
    },
    h6: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [tab, setTab] = useState("dashboard"); // dashboard, farmers, deliveries, payments
  
  // Data State
  const [farmers, setFarmers] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    total_farmers: 0,
    total_tonnage: 0,
    total_paid: 0,
    total_value: 0,
    pending_balance: 0,
    recent_deliveries: [],
    recent_payments: []
  });
  const [deliveries, setDeliveries] = useState([]);
  const [payments, setPayments] = useState([]);

  // Search & Filter
  const [farmerSearch, setFarmerSearch] = useState("");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");

  // Modals & Forms
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [farmerHistoryOpen, setFarmerHistoryOpen] = useState(false);
  
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerHistory, setFarmerHistory] = useState({ deliveries: [], payments: [] });

  const [deliveryForm, setDeliveryForm] = useState({
    farmer_id: "",
    tonnage: "",
    price_per_ton: "4500" // default standard price per ton KES
  });

  const [paymentForm, setPaymentForm] = useState({
    farmer_id: "",
    amount: ""
  });

  // Notifications
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success" // success, error
  });

  // Load Data function
  const loadData = async () => {
    try {
      // Fetch Dashboard
      const dashRes = await api.get("/dashboard");
      setDashboardData(dashRes.data);

      // Fetch Farmers
      const farmersRes = await api.get("/farmers");
      setFarmers(farmersRes.data);

      // Fetch Deliveries
      const delRes = await api.get("/deliveries");
      setDeliveries(delRes.data);

      // Fetch Payments
      const payRes = await api.get("/payments");
      setPayments(payRes.data);

    } catch (err) {
      console.error(err);
      showNotification("Failed to load ERP server data", "error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Submit recorded delivery
  const handleRecordDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!deliveryForm.farmer_id || !deliveryForm.tonnage || !deliveryForm.price_per_ton) {
      showNotification("Please fill in all fields", "error");
      return;
    }
    try {
      await api.post("/deliveries", {
        farmer_id: parseInt(deliveryForm.farmer_id),
        tonnage: parseFloat(deliveryForm.tonnage),
        price_per_ton: parseFloat(deliveryForm.price_per_ton)
      });
      showNotification("Sugarcane delivery logged successfully!");
      setDeliveryDialogOpen(false);
      setDeliveryForm({ farmer_id: "", tonnage: "", price_per_ton: "4500" });
      loadData();
    } catch (err) {
      console.error(err);
      showNotification("Failed to log sugarcane delivery", "error");
    }
  };

  // Submit recorded payment
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.farmer_id || !paymentForm.amount) {
      showNotification("Please fill in all fields", "error");
      return;
    }
    
    // Check if farmer has pending balance
    const farmer = farmers.find(f => f.id === parseInt(paymentForm.farmer_id));
    if (farmer) {
      // Find total value delivered from deliveries
      const totalDelivered = deliveries
        .filter(d => d.farmer_id === farmer.id)
        .reduce((sum, d) => sum + (d.tonnage * d.price_per_ton), 0);
      const pending = totalDelivered - farmer.total_paid;
      
      if (parseFloat(paymentForm.amount) > pending && pending > 0) {
        if (!window.confirm(`Warning: Payment amount (KES ${parseFloat(paymentForm.amount).toLocaleString()}) exceeds the farmer's outstanding balance (KES ${pending.toLocaleString()}). Do you still want to proceed?`)) {
          return;
        }
      }
    }

    try {
      await api.post("/payments", {
        farmer_id: parseInt(paymentForm.farmer_id),
        amount: parseFloat(paymentForm.amount)
      });
      showNotification("Farmer payment processed successfully!");
      setPaymentDialogOpen(false);
      setPaymentForm({ farmer_id: "", amount: "" });
      loadData();
    } catch (err) {
      console.error(err);
      showNotification("Failed to record farmer payment", "error");
    }
  };

  // View individual farmer's history (audit)
  const handleViewFarmerHistory = (farmer) => {
    setSelectedFarmer(farmer);
    const farmerDels = deliveries.filter(d => d.farmer_id === farmer.id);
    const farmerPays = payments.filter(p => p.farmer_id === farmer.id);
    
    setFarmerHistory({
      deliveries: farmerDels,
      payments: farmerPays
    });
    setFarmerHistoryOpen(true);
  };

  // Filter lists
  const filteredFarmers = farmers.filter(f => 
    f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    f.national_id.includes(farmerSearch) ||
    f.phone.includes(farmerSearch)
  );

  const getFarmerName = (id) => {
    const f = farmers.find(farm => farm.id === id);
    return f ? f.name : `Farmer #${id}`;
  };

  const getFarmerIdNum = (id) => {
    const f = farmers.find(farm => farm.id === id);
    return f ? f.national_id : "";
  };

  const filteredDeliveries = deliveries.filter(d => 
    getFarmerName(d.farmer_id).toLowerCase().includes(deliverySearch.toLowerCase()) ||
    getFarmerIdNum(d.farmer_id).includes(deliverySearch)
  );

  const filteredPayments = payments.filter(p => 
    getFarmerName(p.farmer_id).toLowerCase().includes(paymentSearch.toLowerCase()) ||
    getFarmerIdNum(p.farmer_id).includes(paymentSearch)
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        
        {/* SIDEBAR NAVIGATION */}
        <Box sx={{ width: 280, bgcolor: "#111827", borderRight: "1px solid #1f2937", p: 3, display: "flex", flexDirection: "column" }}>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 5 }}>
            <Avatar sx={{ bgcolor: "#10b981", width: 44, height: 44, fontWeight: "bold" }}>🌾</Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontSize: "16px", color: "#fff", lineHeight: 1.2 }}>Sugarcane ERP</Typography>
              <Typography variant="body2" sx={{ fontSize: "11px", color: "#10b981", fontWeight: "600", textTransform: "uppercase", tracking: 0.5 }}>Factory Hub</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
            <Button
              fullWidth
              onClick={() => setTab("dashboard")}
              sx={{
                justifyContent: "flex-start",
                p: 1.5,
                borderRadius: 2,
                color: tab === "dashboard" ? "#10b981" : "#9ca3af",
                bgcolor: tab === "dashboard" ? "rgba(16, 185, 129, 0.08)" : "transparent",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.02)" },
                textTransform: "none",
                fontWeight: 600,
                fontSize: "14px"
              }}
            >
              <Box sx={{ mr: 2, fontSize: "18px" }}>📊</Box> Dashboard Overview
            </Button>

            <Button
              fullWidth
              onClick={() => setTab("farmers")}
              sx={{
                justifyContent: "flex-start",
                p: 1.5,
                borderRadius: 2,
                color: tab === "farmers" ? "#10b981" : "#9ca3af",
                bgcolor: tab === "farmers" ? "rgba(16, 185, 129, 0.08)" : "transparent",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.02)" },
                textTransform: "none",
                fontWeight: 600,
                fontSize: "14px"
              }}
            >
              <Box sx={{ mr: 2, fontSize: "18px" }}>👥</Box> Farmers Directory
            </Button>

            <Button
              fullWidth
              onClick={() => setTab("deliveries")}
              sx={{
                justifyContent: "flex-start",
                p: 1.5,
                borderRadius: 2,
                color: tab === "deliveries" ? "#10b981" : "#9ca3af",
                bgcolor: tab === "deliveries" ? "rgba(16, 185, 129, 0.08)" : "transparent",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.02)" },
                textTransform: "none",
                fontWeight: 600,
                fontSize: "14px"
              }}
            >
              <Box sx={{ mr: 2, fontSize: "18px" }}>🚚</Box> Sugarcane Deliveries
            </Button>

            <Button
              fullWidth
              onClick={() => setTab("payments")}
              sx={{
                justifyContent: "flex-start",
                p: 1.5,
                borderRadius: 2,
                color: tab === "payments" ? "#10b981" : "#9ca3af",
                bgcolor: tab === "payments" ? "rgba(16, 185, 129, 0.08)" : "transparent",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.02)" },
                textTransform: "none",
                fontWeight: 600,
                fontSize: "14px"
              }}
            >
              <Box sx={{ mr: 2, fontSize: "18px" }}>💳</Box> Payment Registry
            </Button>
          </Box>

          <Divider sx={{ my: 2, borderColor: "#1f2937" }} />
          
          <Box sx={{ bgcolor: "#1f2937", p: 2, borderRadius: 3, textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: "#9ca3af", display: "block" }}>Quick Actions</Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="small"
              onClick={() => setDeliveryDialogOpen(true)}
              sx={{ mt: 1.5, fontWeight: "bold", textTransform: "none" }}
            >
              + Record Delivery
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              size="small"
              onClick={() => setPaymentDialogOpen(true)}
              sx={{ mt: 1, fontWeight: "bold", textTransform: "none" }}
            >
              + Record Payment
            </Button>
          </Box>
        </Box>

        {/* MAIN BODY PANEL */}
        <Box sx={{ flexGrow: 1, p: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          
          {/* HEADER SECTION */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h4" sx={{ color: "#fff" }}>
                {tab === "dashboard" && "Dashboard Overview"}
                {tab === "farmers" && "Farmers Directory Registry"}
                {tab === "deliveries" && "Sugarcane Deliveries Log"}
                {tab === "payments" && "Farmer Payout Log"}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                Manage sugarcane inventory, farmer payout statistics, and factory ledger.
              </Typography>
            </Box>
            <Button variant="outlined" color="primary" onClick={loadData} sx={{ textTransform: "none", fontWeight: 600 }}>
              🔄 Sync Ledger Data
            </Button>
          </Box>

          {/* ========================================================================= */}
          {/* TAB CONTENT: DASHBOARD OVERVIEW */}
          {/* ========================================================================= */}
          {tab === "dashboard" && (
            <Grid container spacing={3}>
              {/* KPI STATS */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: "background.paper", border: "1px solid #1f2937", borderRadius: 3 }}>
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>Total Growers</Typography>
                      <Typography variant="h4" sx={{ mt: 1, color: "#fff" }}>{dashboardData.total_farmers}</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "rgba(59, 130, 246, 0.15)", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justify: "center", fontSize: "24px" }}>👥</Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: "background.paper", border: "1px solid #1f2937", borderRadius: 3 }}>
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>Cane Tonnage</Typography>
                      <Typography variant="h4" sx={{ mt: 1, color: "#fff" }}>{dashboardData.total_tonnage ? dashboardData.total_tonnage.toFixed(2) : "0.00"}</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>Tons Delivered</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justify: "center", fontSize: "24px" }}>🚚</Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: "background.paper", border: "1px solid #1f2937", borderRadius: 3 }}>
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>Processed Payouts</Typography>
                      <Typography variant="h5" sx={{ mt: 1.5, color: "#10b981", fontWeight: "bold" }}>
                        KES {dashboardData.total_paid ? dashboardData.total_paid.toLocaleString() : "0"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>Total Paid Out</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justify: "center", fontSize: "24px" }}>💳</Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: "background.paper", border: "1px solid #1f2937", borderRadius: 3 }}>
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>Outstanding Ledger</Typography>
                      <Typography variant="h5" sx={{ mt: 1.5, color: "#f59e0b", fontWeight: "bold" }}>
                        KES {dashboardData.pending_balance ? dashboardData.pending_balance.toLocaleString() : "0"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>Pending Payouts</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "rgba(245, 158, 11, 0.15)", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justify: "center", fontSize: "24px" }}>⚠️</Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* RECENT TABLES */}
              <Grid item xs={12} md={6}>
                <TableContainer component={Paper} sx={{ bgcolor: "background.paper", border: "1px solid #1f2937", borderRadius: 3, p: 2 }}>
                  <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>Recent Sugarcane Deliveries</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Farmer</TableCell>
                        <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Tonnage</TableCell>
                        <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Value (KES)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.recent_deliveries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ color: "text.secondary", py: 3 }}>No recent deliveries</TableCell>
                        </TableRow>
                      ) : (
                        dashboardData.recent_deliveries.map((rd) => (
                          <TableRow key={rd.id}>
                            <TableCell sx={{ color: "#fff" }}>{rd.farmer_name}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{rd.tonnage} Tons</TableCell>
                            <TableCell sx={{ color: "#10b981", fontWeight: 500 }}>KES {rd.total_value.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <TableContainer component={Paper} sx={{ bgcolor: "background.paper", border: "1px solid #1f2937", borderRadius: 3, p: 2 }}>
                  <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>Recent Payments Processed</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Farmer</TableCell>
                        <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Amount (KES)</TableCell>
                        <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Processed Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.recent_payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ color: "text.secondary", py: 3 }}>No recent payments</TableCell>
                        </TableRow>
                      ) : (
                        dashboardData.recent_payments.map((rp) => (
                          <TableRow key={rp.id}>
                            <TableCell sx={{ color: "#fff" }}>{rp.farmer_name}</TableCell>
                            <TableCell sx={{ color: "#10b981", fontWeight: 500 }}>KES {rp.amount.toLocaleString()}</TableCell>
                            <TableCell sx={{ color: "text.secondary" }}>{new Date(rp.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

            </Grid>
          )}

          {/* ========================================================================= */}
          {/* TAB CONTENT: FARMERS DIRECTORY */}
          {/* ========================================================================= */}
          {tab === "farmers" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              
              <TextField
                placeholder="Search farmers by name, national ID, or phone..."
                fullWidth
                variant="outlined"
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#1f2937" }
                }}
              />

              <TableContainer component={Paper} sx={{ border: "1px solid #1f2937", borderRadius: 3 }}>
                <Table>
                  <TableHead sx={{ bgcolor: "#111827" }}>
                    <TableRow>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Name</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Contact Info</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>National ID</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Total Tonnage</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Paid Ledger</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Pending Balance</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFarmers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 5 }}>No farmers found</TableCell>
                      </TableRow>
                    ) : (
                      filteredFarmers.map((f) => {
                        // Find total value delivered
                        const totalDelivered = deliveries
                          .filter(d => d.farmer_id === f.id)
                          .reduce((sum, d) => sum + (d.tonnage * d.price_per_ton), 0);
                        const pendingBalance = Math.max(0, totalDelivered - f.total_paid);

                        return (
                          <TableRow key={f.id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.01)" } }}>
                            <TableCell sx={{ color: "#fff", fontWeight: 500 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "14px", fontWeight: "bold", width: 32, height: 32 }}>
                                  {f.name.charAt(0).toUpperCase()}
                                </Avatar>
                                {f.name}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: "text.secondary" }}>{f.phone}</TableCell>
                            <TableCell><Typography sx={{ fontFamily: "monospace", fontSize: "13px", bgcolor: "#1f2937", px: 1, py: 0.5, borderRadius: 1, display: "inline-block" }}>{f.national_id}</Typography></TableCell>
                            <TableCell sx={{ color: "#fff" }}>{f.total_tonnage.toFixed(2)} Tons</TableCell>
                            <TableCell sx={{ color: "#10b981" }}>KES {f.total_paid.toLocaleString()}</TableCell>
                            <TableCell sx={{ color: pendingBalance > 0 ? "#f59e0b" : "#10b981", fontWeight: 600 }}>
                              KES {pendingBalance.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="text"
                                color="primary"
                                onClick={() => handleViewFarmerHistory(f)}
                                sx={{ textTransform: "none", fontWeight: "bold" }}
                              >
                                View History
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB CONTENT: DELIVERIES LOG */}
          {/* ========================================================================= */}
          {tab === "deliveries" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  placeholder="Search deliveries by farmer name or national ID..."
                  fullWidth
                  variant="outlined"
                  value={deliverySearch}
                  onChange={(e) => setDeliverySearch(e.target.value)}
                  sx={{
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#1f2937" }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setDeliveryDialogOpen(true)}
                  sx={{ px: 3, fontWeight: "bold", textTransform: "none", whiteSpace: "nowrap" }}
                >
                  + Record Sugarcane Delivery
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ border: "1px solid #1f2937", borderRadius: 3 }}>
                <Table>
                  <TableHead sx={{ bgcolor: "#111827" }}>
                    <TableRow>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Delivery ID</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Farmer Name</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Tonnage Delivered</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Price / Ton</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Total Cost</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Record Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDeliveries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 5 }}>No sugarcane deliveries found</TableCell>
                      </TableRow>
                    ) : (
                      filteredDeliveries.map((d) => (
                        <TableRow key={d.id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.01)" } }}>
                          <TableCell sx={{ color: "text.secondary" }}>#{d.id}</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 500 }}>{getFarmerName(d.farmer_id)}</TableCell>
                          <TableCell sx={{ color: "#fff" }}>{d.tonnage.toFixed(2)} Tons</TableCell>
                          <TableCell sx={{ color: "text.secondary" }}>KES {d.price_per_ton.toLocaleString()}</TableCell>
                          <TableCell sx={{ color: "#10b981", fontWeight: 600 }}>KES {(d.tonnage * d.price_per_ton).toLocaleString()}</TableCell>
                          <TableCell sx={{ color: "text.secondary" }}>{new Date(d.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB CONTENT: PAYMENTS REGISTRY */}
          {/* ========================================================================= */}
          {tab === "payments" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  placeholder="Search payments by farmer name or national ID..."
                  fullWidth
                  variant="outlined"
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  sx={{
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#1f2937" }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setPaymentDialogOpen(true)}
                  sx={{ px: 3, fontWeight: "bold", textTransform: "none", whiteSpace: "nowrap" }}
                >
                  + Process Farmer Payment
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ border: "1px solid #1f2937", borderRadius: 3 }}>
                <Table>
                  <TableHead sx={{ bgcolor: "#111827" }}>
                    <TableRow>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Receipt ID</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Farmer Name</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Processed Amount</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>Transaction Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: "text.secondary", py: 5 }}>No processed payments found</TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((p) => (
                        <TableRow key={p.id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.01)" } }}>
                          <TableCell sx={{ color: "text.secondary" }}>#{p.id}</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 500 }}>{getFarmerName(p.farmer_id)}</TableCell>
                          <TableCell sx={{ color: "#10b981", fontWeight: 600 }}>KES {p.amount.toLocaleString()}</TableCell>
                          <TableCell sx={{ color: "text.secondary" }}>{new Date(p.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

        </Box>

        {/* ========================================================================= */}
        {/* MODAL DIALOGS */}
        {/* ========================================================================= */}

        {/* RECORD DELIVERY DIALOG */}
        <Dialog open={deliveryDialogOpen} onClose={() => setDeliveryDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: "#fff", fontWeight: "bold" }}>Record Sugarcane Delivery</DialogTitle>
          <form onSubmit={handleRecordDeliverySubmit}>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel id="select-farmer-label" sx={{ color: "#9ca3af" }}>Select Farmer</InputLabel>
                <Select
                  labelId="select-farmer-label"
                  value={deliveryForm.farmer_id}
                  label="Select Farmer"
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, farmer_id: e.target.value })}
                  sx={{ bgcolor: "#1e293b", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#374151" } }}
                >
                  {farmers.map(f => (
                    <MenuItem key={f.id} value={f.id}>{f.name} (ID: {f.national_id})</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Sugarcane Tonnage (Tons)"
                type="number"
                inputProps={{ step: "0.01", min: "0.01" }}
                required
                fullWidth
                value={deliveryForm.tonnage}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, tonnage: e.target.value })}
                sx={{ bgcolor: "#1e293b", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#374151" } }}
              />

              <TextField
                label="Price Per Ton (KES)"
                type="number"
                required
                fullWidth
                value={deliveryForm.price_per_ton}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, price_per_ton: e.target.value })}
                sx={{ bgcolor: "#1e293b", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#374151" } }}
              />
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDeliveryDialogOpen(false)} color="inherit" sx={{ textTransform: "none" }}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" sx={{ textTransform: "none", fontWeight: "bold" }}>Save Delivery</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* PROCESS PAYMENT DIALOG */}
        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: "#fff", fontWeight: "bold" }}>Process Farmer Payout</DialogTitle>
          <form onSubmit={handleRecordPaymentSubmit}>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel id="select-farmer-payment-label" sx={{ color: "#9ca3af" }}>Select Farmer</InputLabel>
                <Select
                  labelId="select-farmer-payment-label"
                  value={paymentForm.farmer_id}
                  label="Select Farmer"
                  onChange={(e) => setPaymentForm({ ...paymentForm, farmer_id: e.target.value })}
                  sx={{ bgcolor: "#1e293b", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#374151" } }}
                >
                  {farmers.map(f => {
                    const totalDelivered = deliveries
                      .filter(d => d.farmer_id === f.id)
                      .reduce((sum, d) => sum + (d.tonnage * d.price_per_ton), 0);
                    const pending = Math.max(0, totalDelivered - f.total_paid);
                    return (
                      <MenuItem key={f.id} value={f.id}>
                        {f.name} (ID: {f.national_id}) | Pending: KES {pending.toLocaleString()}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <TextField
                label="Payment Amount (KES)"
                type="number"
                inputProps={{ step: "1", min: "1" }}
                required
                fullWidth
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                sx={{ bgcolor: "#1e293b", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#374151" } }}
              />
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setPaymentDialogOpen(false)} color="inherit" sx={{ textTransform: "none" }}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" sx={{ textTransform: "none", fontWeight: "bold" }}>Process Payment</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* AUDIT / HISTORY DIALOG */}
        <Dialog open={farmerHistoryOpen} onClose={() => setFarmerHistoryOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ color: "#fff", fontWeight: "bold", borderBottom: "1px solid #1f2937", pb: 2 }}>
            📄 Ledger Audit History: {selectedFarmer?.name}
          </DialogTitle>
          <DialogContent sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, bgcolor: "#1e293b", p: 2, borderRadius: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Total Tonnage Delivered</Typography>
                <Typography variant="body1" sx={{ color: "#fff", fontWeight: "bold", mt: 0.5 }}>{selectedFarmer?.total_tonnage.toFixed(2)} Tons</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Total Paid Out</Typography>
                <Typography variant="body1" sx={{ color: "#10b981", fontWeight: "bold", mt: 0.5 }}>KES {selectedFarmer?.total_paid.toLocaleString()}</Typography>
              </Box>
              <Box>
                {(() => {
                  const totalVal = farmerHistory.deliveries.reduce((sum, d) => sum + (d.tonnage * d.price_per_ton), 0);
                  const pending = Math.max(0, totalVal - (selectedFarmer?.total_paid || 0));
                  return (
                    <>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>Pending Balance</Typography>
                      <Typography variant="body1" sx={{ color: pending > 0 ? "#f59e0b" : "#10b981", fontWeight: "bold", mt: 0.5 }}>KES {pending.toLocaleString()}</Typography>
                    </>
                  );
                })()}
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: "bold", mb: 1.5 }}>Sugarcane Deliveries</Typography>
                <TableContainer component={Paper} sx={{ bgcolor: "#111827", maxHeight: 300, border: "1px solid #1f2937" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: "#111827", color: "text.secondary", fontWeight: "bold" }}>Tons</TableCell>
                        <TableCell sx={{ bgcolor: "#111827", color: "text.secondary", fontWeight: "bold" }}>Total (KES)</TableCell>
                        <TableCell sx={{ bgcolor: "#111827", color: "text.secondary", fontWeight: "bold" }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {farmerHistory.deliveries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ color: "text.secondary", py: 3 }}>No deliveries logged</TableCell>
                        </TableRow>
                      ) : (
                        farmerHistory.deliveries.map(d => (
                          <TableRow key={d.id}>
                            <TableCell sx={{ color: "#fff" }}>{d.tonnage} Tons</TableCell>
                            <TableCell sx={{ color: "#10b981" }}>KES {(d.tonnage * d.price_per_ton).toLocaleString()}</TableCell>
                            <TableCell sx={{ color: "text.secondary", fontSize: "11px" }}>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: "bold", mb: 1.5 }}>Payouts Log</Typography>
                <TableContainer component={Paper} sx={{ bgcolor: "#111827", maxHeight: 300, border: "1px solid #1f2937" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: "#111827", color: "text.secondary", fontWeight: "bold" }}>Amount (KES)</TableCell>
                        <TableCell sx={{ bgcolor: "#111827", color: "text.secondary", fontWeight: "bold" }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {farmerHistory.payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} align="center" sx={{ color: "text.secondary", py: 3 }}>No payments processed</TableCell>
                        </TableRow>
                      ) : (
                        farmerHistory.payments.map(p => (
                          <TableRow key={p.id}>
                            <TableCell sx={{ color: "#10b981", fontWeight: 500 }}>KES {p.amount.toLocaleString()}</TableCell>
                            <TableCell sx={{ color: "text.secondary", fontSize: "11px" }}>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>

          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: "1px solid #1f2937" }}>
            <Button onClick={() => setFarmerHistoryOpen(false)} variant="contained" color="inherit" sx={{ textTransform: "none" }}>Close Audit</Button>
          </DialogActions>
        </Dialog>

        {/* STATUS ALERTS / SNACKBAR */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: "100%", fontWeight: "bold" }}>
            {notification.message}
          </Alert>
        </Snackbar>

      </Box>
    </ThemeProvider>
  );
}

export default App;
