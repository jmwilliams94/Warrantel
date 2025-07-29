'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Upload, FileText, Camera, Calendar, ExternalLink, ArrowLeft, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

const WarrantyTracker = () => {
  const [currentView, setCurrentView] = useState('products');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    purchase_date: '',
    warranty_expiry: '',
    category: 'Electronics'
  });

  const [newEvent, setNewEvent] = useState({
    event_date: new Date().toISOString().split('T')[0],
    event_type: 'issue',
    title: '',
    description: ''
  });

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadProductEvents(selectedProduct.id);
      loadProductFiles(selectedProduct.id);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(`Failed to load products: ${err.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProductEvents = async (productId) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('product_id', productId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(`Failed to load events: ${err.message}`);
    }
  };

  const loadProductFiles = async (productId) => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;
      
      setFiles(data || []);
    } catch (err) {
      console.error('Error loading files:', err);
      setError(`Failed to load files: ${err.message}`);
    }
  };

  const getEventTypeColor = (type) => {
    const colors = {
      purchase: 'bg-green-500',
      issue: 'bg-red-500',
      contact: 'bg-blue-500',
      maintenance: 'bg-purple-500',
      escalation: 'bg-orange-500',
      resolution: 'bg-teal-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const addProduct = async () => {
    if (newProduct.name && newProduct.purchase_date) {
      try {
        const productData = {
  name: newProduct.name,
  category: newProduct.category,
  purchase_date: newProduct.purchase_date,
  warranty_expiry: newProduct.warranty_expiry || newProduct.purchase_date
  // user_id removed - we'll add proper auth later
};

        const { data: product, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;
        
        const { error: eventError } = await supabase
          .from('events')
          .insert([{
            product_id: product.id,
            event_date: newProduct.purchase_date,
            event_type: 'purchase',
            title: 'Product Purchased',
            description: 'Warranty begins'
          }]);

        if (eventError) throw eventError;

        setNewProduct({ 
          name: '', 
          purchase_date: '', 
          warranty_expiry: '', 
          category: 'Electronics' 
        });
        setShowAddProduct(false);
        loadProducts();
        setError(null);
      } catch (err) {
        console.error('Error adding product:', err);
        setError('Failed to add product: ' + err.message);
      }
    }
  };

  const addEvent = async () => {
    if (newEvent.title && selectedProduct) {
      try {
        const { error } = await supabase
          .from('events')
          .insert([{
            product_id: selectedProduct.id,
            event_date: newEvent.event_date,
            event_type: newEvent.event_type,
            title: newEvent.title,
            description: newEvent.description
          }]);

        if (error) throw error;

        setNewEvent({
          event_date: new Date().toISOString().split('T')[0],
          event_type: 'issue',
          title: '',
          description: ''
        });
        setShowAddEvent(false);
        loadProductEvents(selectedProduct.id);
        setError(null);
      } catch (err) {
        console.error('Error adding event:', err);
        setError('Failed to add event: ' + err.message);
      }
    }
  };

  const exportTimeline = () => {
    if (!selectedProduct) return;

    const exportData = {
      product: selectedProduct.name,
      purchaseDate: selectedProduct.purchase_date,
      warrantyExpiry: selectedProduct.warranty_expiry,
      events: events.map(e => ({
        date: e.event_date,
        type: e.event_type,
        title: e.title,
        description: e.description
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProduct.name.replace(/\s+/g, '_')}_timeline.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ErrorMessage = ({ message, onDismiss }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button onClick={onDismiss} className="text-red-700 hover:text-red-900">×</button>
      </div>
    </div>
  );

  if (currentView === 'timeline' && selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          
          <div className="mb-6">
            <button
              onClick={() => setCurrentView('products')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft size={20} />
              Back to Products
            </button>

            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Purchased: {new Date(selectedProduct.purchase_date).toLocaleDateString()}</div>
                  <div>Warranty expires: {new Date(selectedProduct.warranty_expiry).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={exportTimeline}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download size={16} />
                  Export Timeline
                </button>
                <button
                  onClick={() => setShowAddEvent(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add Event
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Documents & Photos</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Receipts</h3>
                <div className="space-y-2">
                  {files.filter(f => f.file_type === 'receipt').map((file) => (
                    <div key={file.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm">{file.file_name}</span>
                    </div>
                  ))}
                  <button className="flex items-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-gray-400">
                    <Upload size={16} />
                    Upload Receipt
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Photos</h3>
                <div className="space-y-2">
                  {files.filter(f => f.file_type === 'photo').map((file) => (
                    <div key={file.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Camera size={16} className="text-gray-500" />
                      <span className="text-sm">{file.file_name}</span>
                    </div>
                  ))}
                  <button className="flex items-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-gray-400">
                    <Camera size={16} />
                    Add Photo
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 md:p-6">
            <h2 className="text-lg font-semibold mb-6">Event Timeline</h2>
            <div className="relative">
              <div className="hidden md:block absolute left-1/2 transform -translate-x-0.5 w-0.5 h-full bg-gray-300"></div>
              <div className="md:hidden absolute left-6 w-0.5 h-full bg-gray-300"></div>
              
              {events.map((event, index) => {
                const side = index % 2 === 0 ? 'left' : 'right';
                return (
                  <div key={event.id} className="relative mb-8">
                    <div className="md:hidden pl-12">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.event_type)}`}></div>
                          <span className="text-sm font-medium capitalize">{event.event_type}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                        <p className="text-sm text-gray-600">{event.description}</p>
                      </div>
                      <div className="absolute left-5 top-4 w-3 h-3 bg-white border-2 border-blue-500 rounded-full"></div>
                    </div>
                    
                    <div className={`hidden md:flex ${side === 'left' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`w-5/12 ${side === 'left' ? 'pr-12' : 'pl-12'}`}>
                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.event_type)}`}></div>
                              <span className="text-sm font-medium capitalize">{event.event_type}</span>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {new Date(event.event_date).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                          <p className="text-sm text-gray-600">{event.description}</p>
                        </div>
                      </div>
                      <div className="absolute left-1/2 top-4 transform -translate-x-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {showAddEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Add New Event</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="issue">Issue</option>
                    <option value="contact">Contact Support</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="escalation">Escalation</option>
                    <option value="resolution">Resolution</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Brief description of the event"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full p-2 border rounded-lg h-20"
                    placeholder="Detailed description..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={addEvent}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Add Event
                </button>
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Warrantel</h1>
            <p className="text-gray-600">Keep track of your products and their warranty events</p>
          </div>
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Loading products...</div>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      new Date(product.warranty_expiry) > new Date() 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {new Date(product.warranty_expiry) > new Date() ? 'Active' : 'Expired'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Purchased: {new Date(product.purchase_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Expires: {new Date(product.warranty_expiry).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setCurrentView('timeline');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <ExternalLink size={16} />
                    View Timeline
                  </button>
                </div>
              </div>
            ))}

            {products.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 mb-4">No products added yet</p>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Add Your First Product
                </button>
              </div>
            )}
          </div>
        )}

        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g., iPhone 15 Pro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Appliance">Appliance</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={newProduct.purchase_date}
                    onChange={(e) => setNewProduct({...newProduct, purchase_date: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={newProduct.warranty_expiry}
                    onChange={(e) => setNewProduct({...newProduct, warranty_expiry: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={addProduct}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Add Product
                </button>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantyTracker;
