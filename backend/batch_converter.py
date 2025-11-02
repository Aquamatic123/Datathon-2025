"""
Batch HTML to Text Converter
Processes multiple HTML directive/law files from a folder
This is adapted from your original script for batch processing
"""

from bs4 import BeautifulSoup
import html
import os
import re
from typing import Optional


class BatchHTMLConverter:
    """Batch convert HTML directives to clean text files"""
    
    def __init__(self, input_folder: str = 'directives', output_folder: str = 'html_parsing'):
        """
        Initialize the batch converter
        
        Args:
            input_folder: Folder containing HTML files to process
            output_folder: Folder where cleaned text files will be saved
        """
        self.input_folder = input_folder
        self.output_folder = output_folder
        
    def convert_single_file(self, input_path: str, output_path: str) -> bool:
        """
        Convert a single HTML file to cleaned text
        
        Args:
            input_path: Path to input HTML file
            output_path: Path where cleaned text will be saved
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Read HTML content
            if not os.path.exists(input_path):
                print(f"❌ ERROR: Input file '{input_path}' not found.")
                return False
            
            print(f"📖 Reading HTML from: {input_path}")
            
            with open(input_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # Determine parser (prefer lxml if available)
            try:
                import lxml
                parser = 'lxml'
            except ImportError:
                parser = 'html.parser'
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(html_content, parser)
            
            # Remove script and style elements
            for script in soup(['script', 'style']):
                script.decompose()
            
            # Extract text
            plain_text = soup.get_text()
            
            # Decode HTML entities (e.g., &eacute; to é)
            plain_text = html.unescape(plain_text)
            
            # Post-conversion cleaning
            # Remove excess whitespace and newlines
            plain_text = re.sub(r'(\n\s*)+\n', '\n\n', plain_text).strip()
            
            # Remove multiple spaces
            plain_text = re.sub(r' +', ' ', plain_text)
            
            # Ensure output folder exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save to file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(plain_text)
            
            print(f"✅ Saved cleaned text to: {output_path}")
            return True
            
        except Exception as e:
            print(f"❌ ERROR processing {input_path}: {e}")
            return False
    
    def convert_all_files(self, file_extension: str = '.html') -> dict:
        """
        Convert all HTML files in the input folder
        
        Args:
            file_extension: File extension to filter (default: '.html')
            
        Returns:
            Dictionary with conversion results
        """
        # Check if input folder exists
        if not os.path.exists(self.input_folder):
            print(f"❌ ERROR: Input folder '{self.input_folder}' not found.")
            return {'success': 0, 'failed': 0, 'files': []}
        
        # Ensure output folder exists
        os.makedirs(self.output_folder, exist_ok=True)
        print(f"📁 Output folder: '{self.output_folder}'")
        print(f"{'='*60}\n")
        
        # Get all entries in the input folder
        all_entries = os.listdir(self.input_folder)
        
        # Filter for HTML files
        html_files = [f for f in all_entries if f.lower().endswith(file_extension)]
        
        if not html_files:
            print(f"❌ No {file_extension} files found in '{self.input_folder}'")
            return {'success': 0, 'failed': 0, 'files': []}
        
        print(f"Found {len(html_files)} {file_extension} files to process\n")
        
        results = {
            'success': 0,
            'failed': 0,
            'files': []
        }
        
        # Process each file
        for i, filename in enumerate(html_files, 1):
            print(f"[{i}/{len(html_files)}] Processing: {filename}")
            
            input_path = os.path.join(self.input_folder, filename)
            output_filename = f"{filename}_cleaned.txt"
            output_path = os.path.join(self.output_folder, output_filename)
            
            success = self.convert_single_file(input_path, output_path)
            
            if success:
                results['success'] += 1
                results['files'].append({
                    'filename': filename,
                    'status': 'success',
                    'output': output_path
                })
            else:
                results['failed'] += 1
                results['files'].append({
                    'filename': filename,
                    'status': 'failed',
                    'output': None
                })
            
            print()  # Empty line for readability
        
        # Print summary
        print(f"{'='*60}")
        print(f"✅ CONVERSION COMPLETE")
        print(f"   Successful: {results['success']}")
        print(f"   Failed: {results['failed']}")
        print(f"   Total: {len(html_files)}")
        print(f"{'='*60}")
        
        return results


def convert_single_upload(html_content: str, output_filename: Optional[str] = None) -> str:
    """
    Convert a single uploaded HTML content to cleaned text
    This function is designed for single file uploads
    
    Args:
        html_content: HTML content as string
        output_filename: Optional filename to save output
        
    Returns:
        Cleaned text string
    """
    try:
        # Determine parser
        try:
            import lxml
            parser = 'lxml'
        except ImportError:
            parser = 'html.parser'
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(html_content, parser)
        
        # Remove script and style elements
        for script in soup(['script', 'style']):
            script.decompose()
        
        # Extract text
        plain_text = soup.get_text()
        
        # Decode HTML entities
        plain_text = html.unescape(plain_text)
        
        # Clean up whitespace
        plain_text = re.sub(r'(\n\s*)+\n', '\n\n', plain_text).strip()
        plain_text = re.sub(r' +', ' ', plain_text)
        
        # Optionally save to file
        if output_filename:
            with open(output_filename, 'w', encoding='utf-8') as f:
                f.write(plain_text)
            print(f"✅ Saved to: {output_filename}")
        
        return plain_text
        
    except Exception as e:
        raise ValueError(f"Error converting HTML: {str(e)}")


# Example usage for batch processing
if __name__ == "__main__":
    print("🚀 HTML to Text Batch Converter")
    print("="*60)
    print()
    
    # Create converter instance
    converter = BatchHTMLConverter(
        input_folder='directives',
        output_folder='html_parsing'
    )
    
    # Convert all HTML files
    results = converter.convert_all_files(file_extension='.html')
    
    # You can also convert other extensions if needed
    # results = converter.convert_all_files(file_extension='.htm')
    
    print("\n📊 Results saved to 'html_parsing' folder")
