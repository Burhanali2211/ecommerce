import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Address, AddressContextType } from '../types';
import { supabase, db } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddresses = () => {
  const context = useContext(AddressContext);
  if (!context) throw new Error('useAddresses must be used within an AddressProvider');
  return context;
};

export const AddressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const mapDbAddressToAppAddress = (dbAddress: any): Address => ({
    id: dbAddress.id,
    userId: dbAddress.user_id,
    fullName: dbAddress.full_name,
    streetAddress: dbAddress.street_address,
    city: dbAddress.city,
    state: dbAddress.state,
    postalCode: dbAddress.postal_code,
    country: dbAddress.country,
    phone: dbAddress.phone,
    isDefault: dbAddress.is_default,
    type: dbAddress.type,
    createdAt: new Date(dbAddress.created_at),
    updatedAt: dbAddress.updated_at ? new Date(dbAddress.updated_at) : undefined,
  });

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }

    setLoading(true);
    try {
      const data = await db.getAddresses(user.id);
      setAddresses(data.map(mapDbAddressToAppAddress));
    } catch (error) {
      console.error('Error fetching addresses:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch addresses'
      });
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const addAddress = async (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      showNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to add an address'
      });
      return;
    }

    try {
      const addressData = {
        user_id: user.id,
        full_name: address.fullName,
        street_address: address.streetAddress,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country,
        phone: address.phone,
        is_default: address.isDefault || false,
        type: address.type || 'shipping'
      };

      await db.createAddress(addressData);
      await fetchAddresses();
      showNotification({
        type: 'success',
        title: 'Address Added',
        message: 'Your address has been added successfully'
      });
    } catch (error) {
      console.error('Error adding address:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add address'
      });
    }
  };

  const updateAddress = async (address: Address) => {
    if (!address.id) return;

    try {
      const addressData = {
        full_name: address.fullName,
        street_address: address.streetAddress,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country,
        phone: address.phone,
        is_default: address.isDefault,
        type: address.type
      };

      await db.updateAddress(address.id, addressData);
      await fetchAddresses();
      showNotification({
        type: 'success',
        title: 'Address Updated',
        message: 'Your address has been updated successfully'
      });
    } catch (error) {
      console.error('Error updating address:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update address'
      });
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      await db.deleteAddress(addressId);
      await fetchAddresses();
      showNotification({
        type: 'success',
        title: 'Address Deleted',
        message: 'Your address has been deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete address'
      });
    }
  };

  const setDefaultAddress = async (addressId: string, type: 'shipping' | 'billing') => {
    if (!user) return;
    
    try {
      await db.setDefaultAddress(user.id, addressId);
      await fetchAddresses();
      showNotification({
        type: 'success',
        title: 'Default Address Set',
        message: `Default ${type} address has been updated`
      });
    } catch (error) {
      console.error('Error setting default address:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to set default address'
      });
    }
  };

  const value: AddressContextType = {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    fetchAddresses,
    loading
  };

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
};
