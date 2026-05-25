import Foundation
import PDFKit
import UIKit

enum TaxType: String, Codable, CaseIterable, Identifiable {
    case none, tax, vat, gst, custom

    var id: String { rawValue }

    var label: String {
        switch self {
        case .none: return "No tax"
        case .tax: return "Tax"
        case .vat: return "VAT"
        case .gst: return "GST"
        case .custom: return "Custom"
        }
    }

    var registrationPlaceholder: String {
        switch self {
        case .none: return "Tax ID"
        case .tax: return "EIN / Tax ID"
        case .vat: return "VAT No. GB123456789"
        case .gst: return "GST Reg No."
        case .custom: return "Tax ID"
        }
    }

    var defaultPricingMode: PricingMode {
        switch self {
        case .gst: return .inclusive
        default: return .exclusive
        }
    }
}

enum PricingMode: String, Codable, CaseIterable, Identifiable {
    case exclusive, inclusive

    var id: String { rawValue }

    var label: String {
        switch self {
        case .exclusive: return "Tax exclusive (add on top)"
        case .inclusive: return "Tax inclusive (prices include tax)"
        }
    }
}

struct InvoiceLineItem: Identifiable, Codable {
    var id = UUID()
    var description: String = "Service"
    var quantity: Double = 1
    var rate: Double = 100
}

struct InvoiceDraft: Codable {
    var documentNumber: String = "INV-001"
    var clientName: String = ""
    var clientEmail: String = ""
    var issueDate: Date = .now
    var dueDate: Date = Calendar.current.date(byAdding: .day, value: 14, to: .now) ?? .now
    var notes: String = ""
    var taxType: TaxType = .none
    var customTaxLabel: String = ""
    var taxRegistrationNumber: String = ""
    var taxRate: Double = 0
    var pricingMode: PricingMode = .exclusive
    var items: [InvoiceLineItem] = [InvoiceLineItem()]

    var taxLabel: String {
        switch taxType {
        case .none: return "Tax"
        case .tax: return "Tax"
        case .vat: return "VAT"
        case .gst: return "GST"
        case .custom: return customTaxLabel.isEmpty ? "Tax" : customTaxLabel
        }
    }

    var hasTax: Bool {
        taxType != .none && taxRate > 0
    }
}

struct InvoiceTotals {
    let subtotal: Double
    let tax: Double
    let total: Double

    var netSubtotal: Double { subtotal }
}

enum InvoiceCalculator {
    static func totals(for draft: InvoiceDraft) -> InvoiceTotals {
        let gross = draft.items.reduce(0) { $0 + ($1.quantity * $1.rate) }

        guard draft.hasTax else {
            return InvoiceTotals(subtotal: gross, tax: 0, total: gross)
        }

        let rate = draft.taxRate

        switch draft.pricingMode {
        case .exclusive:
            let tax = gross * (rate / 100)
            return InvoiceTotals(subtotal: gross, tax: tax, total: gross + tax)
        case .inclusive:
            let net = extractNetFromGross(gross, taxRate: rate)
            let tax = gross - net
            return InvoiceTotals(subtotal: net, tax: tax, total: gross)
        }
    }

    private static func extractNetFromGross(_ gross: Double, taxRate: Double) -> Double {
        guard taxRate > 0 else { return gross }
        return gross / (1 + taxRate / 100)
    }
}

enum InvoicePDFRenderer {
    private static let forest = UIColor(red: 20 / 255, green: 83 / 255, blue: 45 / 255, alpha: 1)
    private static let sandLight = UIColor(red: 100 / 255, green: 121 / 255, blue: 108 / 255, alpha: 1)
    private static let ink = UIColor(red: 30 / 255, green: 37 / 255, blue: 30 / 255, alpha: 1)

    static func render(draft: InvoiceDraft, businessName: String) throws -> Data {
        let totals = InvoiceCalculator.totals(for: draft)
        let pageRect = CGRect(x: 0, y: 0, width: 595.28, height: 841.89)
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)

        let data = renderer.pdfData { context in
            context.beginPage()
            var y: CGFloat = 40

            drawText(businessName.isEmpty ? "Your Business" : businessName, x: 40, y: y, size: 22, weight: .bold)
            y += 28
            if !draft.taxRegistrationNumber.isEmpty {
                drawText(draft.taxRegistrationNumber, x: 40, y: y, size: 11, color: sandLight)
                y += 18
            }
            drawText("Invoice #\(draft.documentNumber)", x: 40, y: y, size: 16, weight: .semibold, color: forest)
            y += 30

            drawText("Bill to", x: 40, y: y, size: 12, weight: .semibold, color: sandLight)
            y += 18
            drawText(draft.clientName.isEmpty ? "Client name" : draft.clientName, x: 40, y: y, size: 14)
            y += 18
            if !draft.clientEmail.isEmpty {
                drawText(draft.clientEmail, x: 40, y: y, size: 12, color: sandLight)
                y += 18
            }

            y += 16
            drawText("Issue: \(formatDate(draft.issueDate))    Due: \(formatDate(draft.dueDate))", x: 40, y: y, size: 11, color: sandLight)
            y += 30

            drawText("Description", x: 40, y: y, size: 11, weight: .semibold)
            drawText("Qty", x: 340, y: y, size: 11, weight: .semibold)
            drawText("Rate", x: 400, y: y, size: 11, weight: .semibold)
            drawText("Amount", x: 480, y: y, size: 11, weight: .semibold)
            y += 18

            for item in draft.items {
                let amount = item.quantity * item.rate
                drawText(item.description, x: 40, y: y, size: 12)
                drawText(formatNumber(item.quantity), x: 340, y: y, size: 12)
                drawText(formatMoney(item.rate), x: 400, y: y, size: 12)
                drawText(formatMoney(amount), x: 480, y: y, size: 12)
                y += 20
            }

            y += 10
            drawText("Subtotal", x: 400, y: y, size: 12, weight: .semibold)
            drawText(formatMoney(totals.subtotal), x: 480, y: y, size: 12)
            y += 18

            if draft.hasTax {
                drawText("\(draft.taxLabel) (\(formatNumber(draft.taxRate))%)", x: 400, y: y, size: 12)
                drawText(formatMoney(totals.tax), x: 480, y: y, size: 12)
                y += 18
            }

            drawText("Total", x: 400, y: y, size: 14, weight: .bold)
            drawText(formatMoney(totals.total), x: 480, y: y, size: 14, weight: .bold)
            y += 24

            if draft.pricingMode == .inclusive && draft.hasTax {
                drawText("Prices include tax", x: 400, y: y, size: 10, color: sandLight)
                y += 20
            }

            if !draft.notes.isEmpty {
                drawText("Notes", x: 40, y: y, size: 12, weight: .semibold)
                y += 18
                drawMultiline(draft.notes, x: 40, y: &y, width: 515, size: 11)
            }

            let footerY = pageRect.height - 40
            drawText("For detailed invoices, visit paperless.tools", x: 40, y: footerY, size: 10, color: sandLight)
        }

        return data
    }

    private static func drawText(
        _ text: String,
        x: CGFloat,
        y: CGFloat,
        size: CGFloat,
        weight: UIFont.Weight = .regular,
        color: UIColor = ink
    ) {
        let attrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color,
        ]
        text.draw(at: CGPoint(x: x, y: y), withAttributes: attrs)
    }

    private static func drawMultiline(_ text: String, x: CGFloat, y: inout CGFloat, width: CGFloat, size: CGFloat) {
        let paragraph = NSMutableParagraphStyle()
        paragraph.lineBreakMode = .byWordWrapping
        let attrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size),
            .foregroundColor: ink,
            .paragraphStyle: paragraph,
        ]
        let rect = CGRect(x: x, y: y, width: width, height: 1000)
        let bounding = text.boundingRect(with: CGSize(width: width, height: 1000), options: [.usesLineFragmentOrigin], attributes: attrs, context: nil)
        text.draw(in: rect, withAttributes: attrs)
        y += bounding.height + 8
    }

    private static func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    private static func formatMoney(_ value: Double) -> String {
        String(format: "$%.2f", value)
    }

    private static func formatNumber(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", value) : String(format: "%.2f", value)
    }
}
