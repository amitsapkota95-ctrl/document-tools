import SwiftUI
import UIKit

extension View {
    func paperlessScreenBackground() -> some View {
        background(Color.paper.ignoresSafeArea())
    }

    func paperlessListStyle() -> some View {
        listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(Color.cream)
    }
}

enum PaperlessAppearance {
    static func configure() {
        let paper = Color.paperUIColor

        UIWindow.appearance().backgroundColor = paper

        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithOpaqueBackground()
        tabBarAppearance.backgroundColor = paper
        tabBarAppearance.shadowColor = UIColor.separator

        UITabBar.appearance().standardAppearance = tabBarAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance

        let navBarAppearance = UINavigationBarAppearance()
        navBarAppearance.configureWithOpaqueBackground()
        navBarAppearance.backgroundColor = paper
        navBarAppearance.shadowColor = UIColor.separator

        UINavigationBar.appearance().standardAppearance = navBarAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navBarAppearance
        UINavigationBar.appearance().compactAppearance = navBarAppearance
    }
}
