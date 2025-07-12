import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { CrimeData, KPIData, ActiveFilters } from '../types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportConfig {
  title: string;
  includeCharts: boolean;
  includeTable: boolean;
  includeKPIs: boolean;
  includeSummary: boolean;
  tableLimit?: number;
}

export class ReportGenerator {
  private data: CrimeData[];
  private kpiData: KPIData;
  private activeFilters: ActiveFilters;
  private config: ReportConfig;

  constructor(
    data: CrimeData[],
    kpiData: KPIData,
    activeFilters: ActiveFilters,
    config: ReportConfig
  ) {
    this.data = data;
    this.kpiData = kpiData;
    this.activeFilters = activeFilters;
    this.config = config;
  }

  async generatePDFReport(): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.config.title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Subtitle with date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Generated on: ${reportDate}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Active Filters Summary
    if (this.hasActiveFilters()) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Applied Filters:', 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const filterText = this.getFilterSummaryText();
      const splitText = pdf.splitTextToSize(filterText, pageWidth - 40);
      pdf.text(splitText, 20, yPosition);
      yPosition += splitText.length * 4 + 10;
    }

    // KPIs Section
    if (this.config.includeKPIs) {
      yPosition = this.addKPIsSection(pdf, yPosition, pageWidth, pageHeight);
    }

    // Summary Section
    if (this.config.includeSummary) {
      yPosition = this.addSummarySection(pdf, yPosition, pageWidth, pageHeight);
    }

    // Charts Section
    if (this.config.includeCharts) {
      yPosition = await this.addChartsSection(pdf, yPosition, pageWidth, pageHeight);
    }

    // Data Table Section
    if (this.config.includeTable) {
      yPosition = this.addTableSection(pdf, yPosition, pageWidth, pageHeight);
    }

    // Footer
    this.addFooter(pdf, pageWidth, pageHeight);

    // Save the PDF
    const fileName = `crime_report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }

  generateExcelReport(): void {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Crime Data Analysis Report'],
      ['Generated on:', new Date().toLocaleDateString()],
      [''],
      ['Key Performance Indicators'],
      ['Total Cases', this.kpiData.totalCases],
      ['Total Districts', this.kpiData.totalDistricts],
      ['Repeat Offenders', this.kpiData.repeatOffenders],
      ['Total Accused', this.kpiData.totalAccused],
      ['Total Arrested', this.kpiData.totalArrested],
      [''],
      ['Top 5 Zones by Volume'],
      ['Zone', 'Cases'],
      ...this.kpiData.topZones.map(zone => [zone.zone, zone.count])
    ];

    if (this.hasActiveFilters()) {
      summaryData.splice(3, 0, ['Applied Filters'], [this.getFilterSummaryText()], ['']);
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Data Sheet
    if (this.config.includeTable) {
      const dataToExport = this.config.tableLimit 
        ? this.data.slice(0, this.config.tableLimit)
        : this.data;
      
      const dataSheet = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Crime Data');
    }

    // Analytics Sheet
    const analyticsData = this.generateAnalyticsData();
    const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData);
    XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics');

    // Save the Excel file
    const fileName = `crime_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private addKPIsSection(pdf: jsPDF, yPosition: number, pageWidth: number, pageHeight: number): number {
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Performance Indicators', 20, yPosition);
    yPosition += 15;

    const kpiData = [
      ['Metric', 'Value'],
      ['Total Cases', this.kpiData.totalCases.toLocaleString()],
      ['Total Districts Involved', this.kpiData.totalDistricts.toString()],
      ['Repeat Offenders', this.kpiData.repeatOffenders.toLocaleString()],
      ['Total Accused', this.kpiData.totalAccused.toLocaleString()],
      ['Total Arrested', this.kpiData.totalArrested.toLocaleString()]
    ];

    pdf.autoTable({
      head: [kpiData[0]],
      body: kpiData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 }
    });

    return (pdf as any).lastAutoTable.finalY + 15;
  }

  private addSummarySection(pdf: jsPDF, yPosition: number, pageWidth: number, pageHeight: number): number {
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    const summary = this.generateExecutiveSummary();
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const splitSummary = pdf.splitTextToSize(summary, pageWidth - 40);
    pdf.text(splitSummary, 20, yPosition);
    yPosition += splitSummary.length * 5 + 15;

    // Top Zones Table
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Top 5 Zones by Crime Volume', 20, yPosition);
    yPosition += 10;

    const topZonesData = [
      ['Rank', 'Zone', 'Cases', 'Percentage'],
      ...this.kpiData.topZones.map((zone, index) => [
        (index + 1).toString(),
        zone.zone,
        zone.count.toString(),
        `${((zone.count / this.kpiData.totalCases) * 100).toFixed(1)}%`
      ])
    ];

    pdf.autoTable({
      head: [topZonesData[0]],
      body: topZonesData.slice(1),
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 20, right: 20 }
    });

    return (pdf as any).lastAutoTable.finalY + 15;
  }

  private async addChartsSection(pdf: jsPDF, yPosition: number, pageWidth: number, pageHeight: number): Promise<number> {
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Charts and Visualizations', 20, yPosition);
    yPosition += 15;

    // Note: In a real implementation, you would capture chart images
    // For now, we'll add a placeholder
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Charts would be captured and embedded here in the full implementation.', 20, yPosition);
    pdf.text('This requires additional setup to capture chart canvas elements.', 20, yPosition + 7);
    yPosition += 25;

    return yPosition;
  }

  private addTableSection(pdf: jsPDF, yPosition: number, pageWidth: number, pageHeight: number): number {
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Crime Data Table', 20, yPosition);
    yPosition += 15;

    const dataToShow = this.config.tableLimit 
      ? this.data.slice(0, this.config.tableLimit)
      : this.data.slice(0, 50); // Limit for PDF readability

    if (dataToShow.length === 0) {
      pdf.setFontSize(11);
      pdf.text('No data available with current filters.', 20, yPosition);
      return yPosition + 15;
    }

    // Select key columns for PDF table
    const keyColumns = ['S.NO', 'Zone', 'DISTRICT', 'YEAR', 'HEAD', 'PS', 'Accused Age', 'Occurrence time'];
    const headers = keyColumns.filter(col => dataToShow[0].hasOwnProperty(col));
    
    const tableData = [
      headers,
      ...dataToShow.map(row => headers.map(header => String(row[header] || '')))
    ];

    pdf.autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 }
      }
    });

    if (this.data.length > dataToShow.length) {
      const finalY = (pdf as any).lastAutoTable.finalY + 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Showing ${dataToShow.length} of ${this.data.length} total records.`, 20, finalY);
      return finalY + 10;
    }

    return (pdf as any).lastAutoTable.finalY + 15;
  }

  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    const pageCount = pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Crime Analytics Dashboard - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  private hasActiveFilters(): boolean {
    return Object.values(this.activeFilters).some(filters => filters.length > 0);
  }

  private getFilterSummaryText(): string {
    const activeFilterTexts: string[] = [];
    
    Object.entries(this.activeFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        const filterName = key.charAt(0).toUpperCase() + key.slice(1);
        if (values.length <= 3) {
          activeFilterTexts.push(`${filterName}: ${values.join(', ')}`);
        } else {
          activeFilterTexts.push(`${filterName}: ${values.slice(0, 3).join(', ')} (+${values.length - 3} more)`);
        }
      }
    });

    return activeFilterTexts.length > 0 
      ? activeFilterTexts.join(' | ')
      : 'No filters applied - showing all data';
  }

  private generateExecutiveSummary(): string {
    const totalCases = this.kpiData.totalCases;
    const topZone = this.kpiData.topZones[0];
    const repeatOffenderRate = ((this.kpiData.repeatOffenders / totalCases) * 100).toFixed(1);
    
    return `This report analyzes ${totalCases.toLocaleString()} crime cases across ${this.kpiData.totalDistricts} districts. ` +
           `The highest crime volume is recorded in ${topZone?.zone || 'N/A'} zone with ${topZone?.count || 0} cases. ` +
           `Repeat offenders account for ${repeatOffenderRate}% of total cases, indicating ${parseFloat(repeatOffenderRate) > 15 ? 'a significant' : 'a moderate'} recidivism rate. ` +
           `Out of ${this.kpiData.totalAccused.toLocaleString()} accused individuals, ${this.kpiData.totalArrested.toLocaleString()} were arrested, ` +
           `representing a ${((this.kpiData.totalArrested / this.kpiData.totalAccused) * 100).toFixed(1)}% arrest rate.`;
  }

  private generateAnalyticsData(): any[][] {
    const yearCounts: { [key: string]: number } = {};
    const zoneCounts: { [key: string]: number } = {};
    const crimeTypeCounts: { [key: string]: number } = {};

    this.data.forEach(row => {
      const year = String(row.YEAR);
      const zone = String(row.Zone);
      const crimeType = String(row.HEAD);

      yearCounts[year] = (yearCounts[year] || 0) + 1;
      zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
      crimeTypeCounts[crimeType] = (crimeTypeCounts[crimeType] || 0) + 1;
    });

    return [
      ['Analytics Summary'],
      [''],
      ['Cases by Year'],
      ['Year', 'Cases'],
      ...Object.entries(yearCounts).map(([year, count]) => [year, count]),
      [''],
      ['Cases by Zone'],
      ['Zone', 'Cases'],
      ...Object.entries(zoneCounts).map(([zone, count]) => [zone, count]),
      [''],
      ['Cases by Crime Type'],
      ['Crime Type', 'Cases'],
      ...Object.entries(crimeTypeCounts).map(([type, count]) => [type, count])
    ];
  }
}