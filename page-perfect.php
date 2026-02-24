<?php
/**
 * Plugin Name: Page Perfect
 * Plugin URI:  https://digitallinear.com
 * Description: Blank page generator — create printable lined, graph, and blank pages in any size.
 * Version:     1.0.0
 * Author:      DigitalLinear
 * License:     GPL-2.0-or-later
 * Text Domain: page-perfect
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Prevent direct file access.
}

/**
 * Register the shortcode [page_perfect] that embeds the React app.
 */
function page_perfect_shortcode() {
    page_perfect_enqueue_assets();
    return '<div id="page-perfect-root"></div>';
}
add_shortcode( 'page_perfect', 'page_perfect_shortcode' );

/**
 * Enqueue JS, CSS, and AdSense only when the shortcode is on the page.
 * Called lazily from the shortcode so assets don't load on every page.
 */
function page_perfect_enqueue_assets() {
    $base = plugin_dir_url( __FILE__ ) . 'dist/';
    $ver  = '1.0.0';

    // Main stylesheet.
    wp_enqueue_style(
        'page-perfect-css',
        $base . 'index.css',
        [],
        $ver
    );

    // Main React bundle (ES module).
    wp_enqueue_script(
        'page-perfect-js',
        $base . 'index.js',
        [],
        $ver,
        true // Load in footer.
    );

    // AdSense — enqueue via WordPress so it isn't duplicated.
    wp_enqueue_script(
        'page-perfect-adsense',
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1165028160233098',
        [],
        null,
        false // Load in <head> as AdSense expects.
    );
}

/**
 * Add type="module" and crossorigin to the React bundle script tag.
 * WordPress does not add type="module" natively, so we filter it in.
 */
function page_perfect_script_type( $tag, $handle, $src ) {
    if ( $handle === 'page-perfect-js' ) {
        return '<script type="module" crossorigin src="' . esc_url( $src ) . '"></script>' . "\n";
    }
    return $tag;
}
add_filter( 'script_loader_tag', 'page_perfect_script_type', 10, 3 );

/**
 * Add async + crossorigin attributes to the AdSense script tag.
 */
function page_perfect_adsense_attrs( $tag, $handle ) {
    if ( $handle === 'page-perfect-adsense' ) {
        $tag = str_replace( '<script ', '<script async crossorigin="anonymous" ', $tag );
    }
    return $tag;
}
add_filter( 'script_loader_tag', 'page_perfect_adsense_attrs', 10, 2 );
