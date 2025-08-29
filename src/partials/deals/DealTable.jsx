import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Edit2, Trash2, ExternalLink, MoreVertical } from 'lucide-react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

const statusColors = {
  prospecting: 'bg-gray-100 text-gray-800',
  initial_contact: 'bg-blue-100 text-blue-800',
  analysis: 'bg-purple-100 text-purple-800',
  loi_submitted: 'bg-yellow-100 text-yellow-800',
  due_diligence: 'bg-pink-100 text-pink-800',
  negotiation: 'bg-orange-100 text-orange-800',
  under_contract: 'bg-indigo-100 text-indigo-800',
  closing: 'bg-green-100 text-green-800',
};

const statusLabels = {
  prospecting: 'Prospecting',
  initial_contact: 'Initial Contact',
  analysis: 'Analysis',
  loi_submitted: 'LOI Submitted',
  due_diligence: 'Due Diligence',
  negotiation: 'Negotiation',
  under_contract: 'Under Contract',
  closing: 'Closing',
};

function DealTable({ deals, onEditDeal, onDeleteDeal, onStatusChange }) {
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);

  // Sort deals
  const sortedDeals = [...deals].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle null/undefined values
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // Handle numeric fields
    if (['asking_price', 'annual_revenue', 'annual_profit', 'priority'].includes(sortField)) {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    // Handle date fields
    if (['created_at', 'updated_at'].includes(sortField)) {
      aValue = new Date(aValue).getTime() || 0;
      bValue = new Date(bValue).getTime() || 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleMenuOpen = (event, deal) => {
    setAnchorEl(event.currentTarget);
    setSelectedDeal(deal);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDeal(null);
  };

  const handleStatusSelect = async (newStatus) => {
    if (selectedDeal && onStatusChange) {
      await onStatusChange(selectedDeal.id, newStatus);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedDeal && onEditDeal) {
      onEditDeal(selectedDeal);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedDeal && onDeleteDeal) {
      if (window.confirm('Are you sure you want to delete this deal?')) {
        onDeleteDeal(selectedDeal.id);
      }
    }
    handleMenuClose();
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ChevronDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                onClick={() => handleSort('business_name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  Business Name
                  <SortIcon field="business_name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th
                onClick={() => handleSort('asking_price')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  Asking Price
                  <SortIcon field="asking_price" />
                </div>
              </th>
              <th
                onClick={() => handleSort('annual_revenue')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  Annual Revenue
                  <SortIcon field="annual_revenue" />
                </div>
              </th>
              <th
                onClick={() => handleSort('annual_profit')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  Annual Profit
                  <SortIcon field="annual_profit" />
                </div>
              </th>
              <th
                onClick={() => handleSort('location')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  Location
                  <SortIcon field="location" />
                </div>
              </th>
              <th
                onClick={() => handleSort('priority')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  Priority
                  <SortIcon field="priority" />
                </div>
              </th>
              <th
                onClick={() => handleSort('created_at')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  Added
                  <SortIcon field="created_at" />
                </div>
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedDeals.map((deal) => (
              <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/deals/${deal.id}`}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    {deal.business_name || 'Unnamed Business'}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  {deal.industry && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {deal.industry}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      statusColors[deal.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabels[deal.status] || deal.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {formatCurrency(deal.asking_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {formatCurrency(deal.annual_revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {formatCurrency(deal.annual_profit)}
                  {deal.annual_profit && deal.annual_revenue && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {((deal.annual_profit / deal.annual_revenue) * 100).toFixed(1)}% margin
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {deal.location || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < (deal.priority || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(deal.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, deal)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {deals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No deals found</p>
          </div>
        )}
      </div>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          className: 'dark:bg-gray-800 dark:text-gray-100',
        }}
      >
        <MenuItem onClick={handleEdit} className="flex items-center gap-2">
          <Edit2 className="w-4 h-4" />
          Edit Deal
        </MenuItem>
        <MenuItem onClick={handleDelete} className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <Trash2 className="w-4 h-4" />
          Delete Deal
        </MenuItem>
        <hr className="my-2 border-gray-200 dark:border-gray-700" />
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
          Change Status
        </div>
        {Object.entries(statusLabels).map(([value, label]) => (
          <MenuItem
            key={value}
            onClick={() => handleStatusSelect(value)}
            selected={selectedDeal?.status === value}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${statusColors[value].split(' ')[0]}`} />
            {label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

export default DealTable;