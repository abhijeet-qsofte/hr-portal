from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from decimal import Decimal

def generate_payslip_pdf(payslip, employee, approver=None, processor=None):
    """
    Generate a PDF payslip for an employee
    
    Args:
        payslip: Payslip model instance
        employee: Employee model instance
        approver: Employee model instance of the approver (optional)
        processor: Employee model instance of the processor (optional)
        
    Returns:
        BytesIO: PDF file as a BytesIO object
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Create custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=1,  # Center alignment
        spaceAfter=12
    )
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10
    )
    
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6
    )
    
    # Build the document content
    content = []
    
    # Add company header
    content.append(Paragraph("ASIKH FARMS", title_style))
    content.append(Paragraph("EMPLOYEE PAYSLIP", title_style))
    content.append(Spacer(1, 0.25*inch))
    
    # Add payslip details
    content.append(Paragraph(f"Payslip for: {payslip.month}", header_style))
    content.append(Spacer(1, 0.1*inch))
    
    # Employee information
    employee_data = [
        ["Employee Name:", employee.name],
        ["Employee ID:", str(employee.id)],
        ["Designation:", employee.designation],
        ["Department:", employee.department if hasattr(employee, 'department') else ""],
    ]
    
    employee_table = Table(employee_data, colWidths=[2*inch, 4*inch])
    employee_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(employee_table)
    content.append(Spacer(1, 0.2*inch))
    
    # Attendance information
    content.append(Paragraph("Attendance Summary", header_style))
    attendance_data = [
        ["Working Days:", str(payslip.working_days)],
        ["Days Present:", str(payslip.days_present)],
        ["Leave Days:", str(payslip.leave_days)],
    ]
    
    attendance_table = Table(attendance_data, colWidths=[2*inch, 4*inch])
    attendance_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(attendance_table)
    content.append(Spacer(1, 0.2*inch))
    
    # Earnings
    content.append(Paragraph("Earnings", header_style))
    
    # Format currency values
    def format_currency(amount):
        if amount is None:
            return "₹0.00"
        return f"₹{amount:,.2f}"
    
    earnings_data = [
        ["Description", "Amount"],
        ["Basic Salary", format_currency(payslip.basic_salary if hasattr(payslip, 'basic_salary') else None)],
        ["House Rent Allowance", format_currency(payslip.house_rent_allowance if hasattr(payslip, 'house_rent_allowance') else None)],
        ["Transport Allowance", format_currency(payslip.transport_allowance if hasattr(payslip, 'transport_allowance') else None)],
        ["Medical Allowance", format_currency(payslip.medical_allowance if hasattr(payslip, 'medical_allowance') else None)],
        ["Overtime", format_currency(payslip.overtime_amount)],
        ["Bonus", format_currency(payslip.bonus)],
        ["Gross Amount", format_currency(payslip.gross_amount)],
    ]
    
    earnings_table = Table(earnings_data, colWidths=[3*inch, 3*inch])
    earnings_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(earnings_table)
    content.append(Spacer(1, 0.2*inch))
    
    # Deductions
    content.append(Paragraph("Deductions", header_style))
    deductions_data = [
        ["Description", "Amount"],
        ["Tax", format_currency(payslip.tax_deduction if hasattr(payslip, 'tax_deduction') else None)],
        ["Provident Fund", format_currency(payslip.provident_fund if hasattr(payslip, 'provident_fund') else None)],
        ["Insurance", format_currency(payslip.insurance if hasattr(payslip, 'insurance') else None)],
        ["Additional Deductions", format_currency(payslip.additional_deductions)],
        ["Total Deductions", format_currency(payslip.total_deductions)],
    ]
    
    deductions_table = Table(deductions_data, colWidths=[3*inch, 3*inch])
    deductions_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(deductions_table)
    content.append(Spacer(1, 0.2*inch))
    
    # Net Amount
    net_data = [
        ["Net Amount", format_currency(payslip.net_amount)],
    ]
    
    net_table = Table(net_data, colWidths=[3*inch, 3*inch])
    net_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(net_table)
    content.append(Spacer(1, 0.3*inch))
    
    # Approval information
    if payslip.is_approved and approver:
        content.append(Paragraph(f"Approved by: {approver.name}", normal_style))
    
    if payslip.is_paid:
        content.append(Paragraph(f"Payment Date: {payslip.payment_date}", normal_style))
        content.append(Paragraph(f"Payment Reference: {payslip.payment_reference}", normal_style))
    
    if processor:
        content.append(Paragraph(f"Generated by: {processor.name}", normal_style))
    
    content.append(Spacer(1, 0.5*inch))
    content.append(Paragraph("This is a computer-generated document and does not require a signature.", normal_style))
    
    # Build the PDF
    doc.build(content)
    buffer.seek(0)
    return buffer
