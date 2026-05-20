from PIL import Image, ImageDraw

def crop_to_circle(input_path, output_path):
    try:
        # Open the image
        img = Image.open(input_path).convert("RGBA")
        
        # Create a mask of the same size
        mask = Image.new("L", img.size, 0)
        draw = ImageDraw.Draw(mask)
        
        # Draw a white circle on the mask
        draw.ellipse((0, 0, img.size[0], img.size[1]), fill=255)
        
        # Apply the mask to the image
        result = Image.new("RGBA", img.size)
        result.paste(img, (0, 0), mask=mask)
        
        # Save the result
        result.save(output_path, "PNG")
        print(f"Successfully created circular image at {output_path}")
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    crop_to_circle("public/beyond-logo.png", "public/beyond-logo-circle.png")
