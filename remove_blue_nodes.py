"""
floor_map_clean.png 에서 파란 노드 제거 (OpenCV Telea 인페인팅)
"""

try:
    from PIL import Image
    import numpy as np
    from scipy.ndimage import binary_dilation
    import cv2
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "numpy", "scipy", "opencv-python-headless"])
    from PIL import Image
    import numpy as np
    from scipy.ndimage import binary_dilation
    import cv2

INPUT  = r"C:\App\assets\floor_map_clean.png"
OUTPUT = r"C:\App\assets\floor_map_clean.png"  # 덮어쓰기

print("이미지 로딩...")
img = Image.open(INPUT).convert("RGB")
arr = np.array(img, dtype=np.float32)

R = arr[:,:,0] / 255.0
G = arr[:,:,1] / 255.0
B = arr[:,:,2] / 255.0

Cmax = np.maximum(np.maximum(R, G), B)
delta = np.clip(Cmax - np.minimum(np.minimum(R, G), B), 0, None)
S = np.where(Cmax > 0, delta / np.where(Cmax > 0, Cmax, 1), 0)
V = Cmax

H = np.zeros_like(R)
m = (Cmax == R) & (delta > 0)
H[m] = (60 * ((G[m] - B[m]) / delta[m])) % 360
m = (Cmax == G) & (delta > 0)
H[m] = (60 * ((B[m] - R[m]) / delta[m])) + 120
m = (Cmax == B) & (delta > 0)
H[m] = (60 * ((R[m] - G[m]) / delta[m])) + 240

# 파란색: 색조 200~260, 채도 높음, 너무 어둡지 않음
blue_mask = (
    (H >= 200) & (H <= 260) &
    (S > 0.30) &
    (V > 0.20)
)
blue_mask = binary_dilation(blue_mask, iterations=2)
print(f"감지된 파란 픽셀: {blue_mask.sum():,}개")

bgr   = arr[:,:,::-1].astype(np.uint8)
mask8 = (blue_mask * 255).astype(np.uint8)
out   = cv2.inpaint(bgr, mask8, inpaintRadius=7, flags=cv2.INPAINT_TELEA)
result = out[:,:,::-1]

Image.fromarray(result).save(OUTPUT, "PNG")
print(f"저장 완료: {OUTPUT}")
