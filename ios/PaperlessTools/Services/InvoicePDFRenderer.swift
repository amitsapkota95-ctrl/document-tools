import Foundation
import PDFKit
import UIKit

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
    var taxRate: Double = 0
    var items: [InvoiceLineItem] = [InvoiceLineItem()]
}

struct InvoiceTotals {
    let subtotal: Double
    let tax: Double
    let total: Double
}

enum InvoiceCalculator {
    static func totals(for draft: InvoiceDraft) -> InvoiceTotals {
        let subtotal = draft.items.reduce(0) { $0 + ($1.quantity * $1.rate) }
        let tax = subtotal * (draft.taxRate / 100)
        return InvoiceTotals(subtotal: subtotal, tax: tax, total: subtotal + tax)
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
            drawText("Tax (\(formatNumber(draft.taxRate))%)", x: 400, y: y, size: 12)
            drawText(formatMoney(totals.tax), x: 480, y: y, size: 12)
            y += 18
            drawText("Total", x: 400, y: y, size: 14, weight: .bold)
            drawText(formatMoney(totals.total), x: 480, y: y, size: 14, weight: .bold)
            y += 30

            if !draft.notes.isEmpty {
                drawText("Notes", x: 40, y: y, size: 12, weight: .semibold)
                y += 18
                drawMultiline(draft.notes, x: 40, y: &y, width: 515, size: 11)
            }
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
