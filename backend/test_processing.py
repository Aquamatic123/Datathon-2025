"""
Test Script for HTML Processing
Tests the document processor with sample HTML content
"""

from document_processor import DocumentProcessor
from batch_converter import convert_single_upload
import os


def test_single_file():
    """Test processing a single HTML file"""
    print("="*60)
    print("TEST 1: Single File Processing")
    print("="*60)
    
    # Sample HTML content (similar to directive structure)
    sample_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Directive 2024/123/EU - Clean Energy</title>
        <meta charset="UTF-8">
    </head>
    <body>
        <h1>Directive 2024/123/EU</h1>
        <h2>Clean Energy Advancement Act</h2>
        
        <p><strong>Jurisdiction:</strong> European Union</p>
        <p><strong>Effective Date:</strong> January 15, 2024</p>
        <p><strong>Status:</strong> Active</p>
        
        <h3>Article 1 - Purpose</h3>
        <p>This directive provides &euro;50 billion in subsidies for electric vehicle 
        manufacturers and renewable energy companies across the EU.</p>
        
        <h3>Article 2 - Key Provisions</h3>
        <ul>
            <li>&euro;7,500 tax credit for EV purchases</li>
            <li>&euro;10B in grants for battery manufacturing facilities</li>
            <li>Tax incentives for solar panel installations</li>
            <li>Mandates for government vehicle fleet electrification by 2030</li>
        </ul>
        
        <h3>Article 3 - Affected Sectors</h3>
        <p>Expected to significantly benefit companies in the EV and renewable 
        energy sectors, including major manufacturers like Tesla, Volkswagen, 
        and renewable energy companies.</p>
        
        <script>
            // This script should be removed
            console.log("test");
        </script>
        
        <style>
            /* This style should be removed */
            body { color: black; }
        </style>
    </body>
    </html>
    """
    
    processor = DocumentProcessor()
    
    try:
        result = processor.process_document(
            content=sample_html.encode('utf-8'),
            content_type='text/html',
            filename='test_directive.html'
        )
        
        print("\n✅ Processing Successful!")
        print(f"Word Count: {result['word_count']}")
        print(f"Character Count: {result['length']}")
        print("\n" + "-"*60)
        print("EXTRACTED TEXT:")
        print("-"*60)
        print(result['text'])
        print("-"*60)
        
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_batch_conversion():
    """Test batch conversion if directives folder exists"""
    print("\n\n" + "="*60)
    print("TEST 2: Batch Conversion (if directives folder exists)")
    print("="*60)
    
    if not os.path.exists('directives'):
        print("\n⚠️  'directives' folder not found - skipping batch test")
        print("   To test batch conversion:")
        print("   1. Create a 'directives' folder")
        print("   2. Add HTML files to it")
        print("   3. Run: python batch_converter.py")
        return
    
    from batch_converter import BatchHTMLConverter
    
    converter = BatchHTMLConverter(
        input_folder='directives',
        output_folder='html_parsing_test'
    )
    
    results = converter.convert_all_files(file_extension='.html')
    
    if results['success'] > 0:
        print("\n✅ Batch conversion successful!")
    else:
        print("\n⚠️  No files were converted")


def test_html_entities():
    """Test HTML entity decoding"""
    print("\n\n" + "="*60)
    print("TEST 3: HTML Entity Decoding")
    print("="*60)
    
    html_with_entities = """
    <html>
    <body>
        <p>This directive applies to the Europ&eacute;an Union.</p>
        <p>Cost: &euro;50 billion</p>
        <p>Companies: Volkswagen AG &amp; Tesla Inc.</p>
        <p>Quote: &ldquo;Clean energy is the future&rdquo;</p>
    </body>
    </html>
    """
    
    text = convert_single_upload(html_with_entities)
    
    print("\nOriginal HTML entities:")
    print("  &eacute; → é")
    print("  &euro; → €")
    print("  &amp; → &")
    print("  &ldquo; / &rdquo; → " / "")
    
    print("\n" + "-"*60)
    print("DECODED TEXT:")
    print("-"*60)
    print(text)
    print("-"*60)
    
    # Check if decoding worked
    if 'é' in text and '€' in text:
        print("\n✅ HTML entities decoded correctly!")
        return True
    else:
        print("\n❌ HTML entity decoding may have issues")
        return False


def test_whitespace_cleanup():
    """Test whitespace and newline cleanup"""
    print("\n\n" + "="*60)
    print("TEST 4: Whitespace Cleanup")
    print("="*60)
    
    messy_html = """
    <html>
    <body>
        <h1>Title</h1>
        
        
        
        <p>Paragraph with     multiple    spaces.</p>
        
        
        <p>Another paragraph.</p>
        
        
        
        
    </body>
    </html>
    """
    
    text = convert_single_upload(messy_html)
    
    print("\n" + "-"*60)
    print("CLEANED TEXT:")
    print("-"*60)
    print(repr(text))  # Use repr to see actual newlines
    print("-"*60)
    
    # Check if excessive newlines were removed
    if '\n\n\n' not in text:
        print("\n✅ Excessive newlines removed!")
        return True
    else:
        print("\n⚠️  Some excessive newlines may remain")
        return False


if __name__ == "__main__":
    print("\n🧪 DOCUMENT PROCESSOR TEST SUITE")
    print("="*60)
    
    results = []
    
    # Run all tests
    results.append(("Single File Processing", test_single_file()))
    test_batch_conversion()  # Doesn't return boolean
    results.append(("HTML Entity Decoding", test_html_entities()))
    results.append(("Whitespace Cleanup", test_whitespace_cleanup()))
    
    # Summary
    print("\n\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    print("="*60)
    
    print("\n💡 Next Steps:")
    print("   1. Test with real directive HTML files")
    print("   2. Run: python api_server.py")
    print("   3. Upload files through the web interface")
