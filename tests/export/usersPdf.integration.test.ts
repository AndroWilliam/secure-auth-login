/**
 * Integration Test for PDF Export
 * 
 * This test verifies the export functionality works end-to-end
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportUsersPdf } from '@/lib/export/usersPdf';
import { UserRow } from '@/lib/admin/types';

// Mock jsPDF and jspdf-autotable
const mockDoc = {
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  text: vi.fn(),
  autoTable: vi.fn(),
  getNumberOfPages: vi.fn(() => 1),
  internal: {
    pageSize: {
      width: 210,
      height: 297
    }
  },
  save: vi.fn()
};

const mockJsPDF = vi.fn(() => mockDoc);

vi.mock('jspdf', () => ({
  default: mockJsPDF
}));

vi.mock('jspdf-autotable', () => ({}));

describe('PDF Export Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export users to PDF successfully', async () => {
    const mockUsers: UserRow[] = [
      {
        id: 'user-1',
        email: 'test1@example.com',
        full_name: 'Test User 1',
        phone: '+1234567890',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'user-2',
        email: 'test2@example.com',
        full_name: 'Test User 2',
        phone: '+9876543210',
        role: 'viewer',
        status: 'idle',
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z'
      }
    ];

    const fileName = await exportUsersPdf(mockUsers, { title: 'Test Export' });

    // Verify PDF document was created
    expect(mockJsPDF).toHaveBeenCalledWith('landscape', 'mm', 'a4');
    
    // Verify title and timestamp were added
    expect(mockDoc.text).toHaveBeenCalledWith('Test Export', 14, 20);
    expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('Generated on:'), 14, 26);
    
    // Verify autoTable was called with correct data
    expect(mockDoc.autoTable).toHaveBeenCalled();
    const autoTableCall = mockDoc.autoTable.mock.calls[0][0];
    
    expect(autoTableCall.head[0]).toEqual(['#', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Date Created']);
    expect(autoTableCall.body).toHaveLength(2);
    expect(autoTableCall.body[0]).toEqual([1, 'Test User 1', 'test1@example.com', '+1234567890', 'Admin', 'Active', '1/1/2024']);
    expect(autoTableCall.body[1]).toEqual([2, 'Test User 2', 'test2@example.com', '+9876543210', 'Viewer', 'Idle', '1/2/2024']);
    
    // Verify PDF was saved
    expect(mockDoc.save).toHaveBeenCalled();
    
    // Verify filename format
    expect(fileName).toMatch(/^users_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.pdf$/);
  });

  it('should handle empty user list', async () => {
    const fileName = await exportUsersPdf([]);

    expect(mockDoc.autoTable).toHaveBeenCalled();
    const autoTableCall = mockDoc.autoTable.mock.calls[0][0];
    expect(autoTableCall.body).toHaveLength(0);
    expect(fileName).toMatch(/^users_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.pdf$/);
  });

  it('should use default title when not provided', async () => {
    await exportUsersPdf([]);

    expect(mockDoc.text).toHaveBeenCalledWith('User Management Export', 14, 20);
  });
});
