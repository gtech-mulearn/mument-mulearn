/**
 * Utility functions for Excel/CSV exports
 */

export interface ExportData {
    id: string;
    user_name: string;
    college?: string;
    college_name?: string | null;
    content: string;
    created_at: string;
    upvote_count: number;
}

/**
 * Export data to Excel file
 * @param data - Array of data to export
 * @param filename - Name of the file (without extension)
 * @param sheetName - Name of the sheet in Excel
 * @param columnConfig - Optional config for custom column formatting
 */
export async function exportToExcel(
    data: ExportData[],
    filename: string = 'export',
    sheetName: string = 'Data'
) {
    try {
        console.log('Export function called with data:', data);
        console.log('Data length:', data.length);

        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }

        // Dynamically import xlsx to keep bundle size down
        const XLSX = await import('xlsx');
        console.log('XLSX loaded successfully');

        // Prepare data for Excel
        const exportData = data.map((item, index) => {
            console.log(`Processing item ${index}:`, item);
            // Handle both 'college' and 'college_name' field names
            const collegeName = item.college || item.college_name || '';
            return {
                'Student Name': item.user_name || '',
                'College': collegeName,
                'Update': item.content || '',
                'Date': item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
                'Upvotes': item.upvote_count || 0
            };
        });

        console.log('Mapped export data:', exportData);

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 20 }, // Student Name
            { wch: 20 }, // College
            { wch: 40 }, // Update
            { wch: 15 }, // Date
            { wch: 10 }  // Upvotes
        ];

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const finalFilename = `${filename}-${timestamp}.xlsx`;

        console.log('Writing file:', finalFilename);

        // Trigger download
        XLSX.writeFile(workbook, finalFilename);
        
        console.log('Export completed successfully');
        alert('File exported successfully!');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        console.error('Error details:', error instanceof Error ? error.message : JSON.stringify(error));
        throw new Error(`Failed to export to Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Export data to CSV
 * @param data - Array of data to export
 * @param filename - Name of the file (without extension)
 */
export function exportToCSV(
    data: ExportData[],
    filename: string = 'export'
) {
    try {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = ['Student Name', 'College', 'Update', 'Date', 'Upvotes'];
        const rows = data.map(item => [
            item.user_name,
            item.college,
            item.content,
            new Date(item.created_at).toLocaleDateString(),
            item.upvote_count
        ]);

        // Create CSV content
        const csvContent = [
            headers.map(h => `"${h}"`).join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}-${timestamp}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        throw new Error('Failed to export to CSV');
    }
}

/**
 * Export with custom columns
 * @param data - Array of data to export
 * @param columnsMap - Map of data keys to column headers
 * @param filename - Name of the file
 * @param format - 'excel' or 'csv'
 */
export async function exportCustom(
    data: Record<string, unknown>[],
    columnsMap: Record<string, string>,
    filename: string = 'export',
    format: 'excel' | 'csv' = 'excel'
) {
    try {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        // Transform data based on columnsMap
        const exportData = data.map(item => {
            const row: Record<string, unknown> = {};
            Object.entries(columnsMap).forEach(([key, header]) => {
                row[header] = item[key];
            });
            return row;
        });

        if (format === 'excel') {
            const XLSX = await import('xlsx');
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

            const timestamp = new Date().toISOString().split('T')[0];
            XLSX.writeFile(workbook, `${filename}-${timestamp}.xlsx`);
        } else {
            const headers = Object.values(columnsMap);
            const rows = exportData.map(item =>
                headers.map(header => `"${item[header] ?? ''}"`)
            );

            const csvContent = [
                headers.map(h => `"${h}"`).join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            const timestamp = new Date().toISOString().split('T')[0];
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}-${timestamp}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error('Error exporting:', error);
        throw new Error(`Failed to export to ${format}`);
    }
}

/**
 * Export checkpoint verification results to Excel
 * @param checkpoints - Array of checkpoint records to export
 * @param filename - Name of the file (without extension)
 */
export async function exportCheckpointsToExcel(
    checkpoints: any[],
    filename: string = 'checkpoints'
) {
    try {
        if (!checkpoints || checkpoints.length === 0) {
            alert('No checkpoints to export');
            return;
        }

        // Dynamically import xlsx
        const XLSX = await import('xlsx');

        // Prepare data for Excel
        const exportData = checkpoints.map((checkpoint) => {
            const teamName = typeof checkpoint.teams === 'object' && checkpoint.teams ? checkpoint.teams.team_name : 'N/A';
            const collegeName = typeof checkpoint.colleges === 'object' && checkpoint.colleges ? checkpoint.colleges.name : 'N/A';
            const createdDate = checkpoint.created_at ? new Date(checkpoint.created_at).toLocaleDateString() : 'N/A';

            return {
                'Team Name': teamName,
                'College': collegeName,
                'Checkpoint Number': checkpoint.checkpoint_number || 'N/A',
                'Status': checkpoint.is_absent ? 'Absent' : 'Present',
                'Meeting Type': checkpoint.meeting_medium ? checkpoint.meeting_medium.replace('_', ' ').charAt(0).toUpperCase() + checkpoint.meeting_medium.slice(1).toLowerCase() : 'N/A',
                'Camera On': checkpoint.is_camera_on ? 'Yes' : 'No',
                'Verification Date': createdDate,
                'Team Introduced': checkpoint.team_introduced ? 'Yes' : 'No',
                'Idea Summary': checkpoint.idea_summary || '',
                'Last Week Progress': checkpoint.last_week_progress || '',
                'Next Week Target': checkpoint.next_week_target || '',
                'Support Details': checkpoint.support_details || '',
                'Feedback': checkpoint.suggestions || ''
            };
        });

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Checkpoints');

        // Set column widths for better readability
        worksheet['!cols'] = [
            { wch: 20 }, // Team Name
            { wch: 20 }, // College
            { wch: 15 }, // Checkpoint Number
            { wch: 12 }, // Status
            { wch: 15 }, // Meeting Type
            { wch: 12 }, // Camera On
            { wch: 15 }, // Verification Date
            { wch: 15 }, // Team Introduced
            { wch: 30 }, // Idea Summary
            { wch: 30 }, // Last Week Progress
            { wch: 30 }, // Next Week Target
            { wch: 30 }, // Support Details
            { wch: 30 }  // Feedback
        ];

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const finalFilename = `${filename}-${timestamp}.xlsx`;

        // Trigger download
        XLSX.writeFile(workbook, finalFilename);
        
        alert('Checkpoints exported successfully!');
    } catch (error) {
        console.error('Error exporting checkpoints to Excel:', error);
        throw new Error(`Failed to export checkpoints: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
