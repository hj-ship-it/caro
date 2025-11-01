# Cờ Cá Rô 100x100

Game cờ cá rô (Gomoku/Five in a Row) chuyên nghiệp với bàn cờ 100x100, được viết bằng HTML, CSS, và JavaScript thuần.

## 🎮 Tính năng

### Gameplay
- **Bàn cờ khổng lồ**: 100x100 ô (10,000 ô chơi)
- **Quy tắc cờ caro chuẩn**: 5 ô liên tiếp để thắng
- **Chơi 2 người**: Trên cùng một thiết bị
- **Ghi nhớ điểm số**: Tự động lưu điểm qua các ván chơi
- **Đánh dấu nước đi cuối**: Ô màu đỏ hiển thị nước đi vừa rồi
- **Highlight chiến thắng**: Các ô thắng cuộc được highlight màu vàng

### Điều khiển & Navigation
- **Zoom In/Out**: Nút +/- hoặc pinch trên mobile
- **Pan/Di chuyển**: Kéo thả bằng chuột hoặc ngón tay
- **Center Board**: Nút ↺ để đưa board về giữa màn hình
- **Hiển thị mức zoom**: Thời gian thực (50% - 500%)

### Mobile Support
- **Touch events**: Hỗ trợ đầy đủ cử chỉ chạm
- **Pinch to zoom**: Hai ngón tay để phóng to/thu nhỏ
- **Responsive design**: Tự động điều chỉnh theo màn hình
- **Landscape mode**: Hỗ trợ cả chế độ ngang và dọc

## 🎯 Cách chơi

1. Mở file `index.html` trong trình duyệt web
2. Người chơi X (màu tím) đi trước
3. Click/tap vào ô trống để đánh dấu
4. Người đầu tiên có 5 ký hiệu liên tiếp sẽ thắng
   - Ngang, dọc, hoặc chéo
5. Điểm số được lưu tự động!

## 🕹️ Hướng dẫn điều khiển

### Desktop
- **Click trái + kéo**: Di chuyển bàn cờ
- **Nút +/-**: Phóng to/thu nhỏ
- **Nút ↺**: Đưa bàn cờ về giữa màn hình
- **Click vào ô**: Đánh dấu nước đi

### Mobile/Tablet
- **Một ngón tay kéo**: Di chuyển bàn cờ
- **Hai ngón tay pinch**: Phóng to/thu nhỏ
- **Tap vào ô**: Đánh dấu nước đi
- **Nút +/-**: Phóng to/thu nhỏ
- **Nút ↺**: Đưa bàn cờ về giữa màn hình

## 📁 Cấu trúc file

```
├── index.html   # File HTML chính
├── style.css    # File CSS cho giao diện và responsive
├── game.js      # Logic game, zoom, pan, touch events
└── README.md    # File hướng dẫn
```

## 💻 Công nghệ sử dụng

- **HTML5**: Cấu trúc trang web
- **CSS3**:
  - Flexbox & Grid Layout
  - Responsive design với media queries
  - Smooth animations và transitions
  - Gradient backgrounds
- **JavaScript (ES6+)**:
  - Dynamic board generation (10,000 cells)
  - Efficient win detection algorithm
  - Touch and mouse event handling
  - Zoom and pan with transform
  - LocalStorage API

## ✨ Tính năng nổi bật

### Performance
- **Tối ưu rendering**: Tạo 10,000 ô một cách hiệu quả
- **Smooth animations**: Hardware-accelerated transforms
- **Efficient win checking**: Chỉ kiểm tra từ nước đi cuối cùng

### UX/UI
- **Visual feedback**: Highlight ô thắng, đánh dấu nước đi cuối
- **Intuitive controls**: Zoom/pan tự nhiên trên mọi thiết bị
- **Responsive**: Hoạt động mượt từ mobile đến desktop
- **Modern design**: Gradient, shadows, rounded corners

### Game Features
- **Unlimited gameplay**: Không giới hạn số ván chơi
- **Score tracking**: Lưu điểm X, O, và hòa
- **Quick reset**: Reset board nhanh chóng
- **Session persistence**: Điểm số không mất khi reload

## 🎨 Customization

Bạn có thể dễ dàng tùy chỉnh:

### Thay đổi kích thước bàn cờ
```javascript
// Trong game.js
const BOARD_SIZE = 100; // Đổi thành 50, 150, etc.
```

### Thay đổi điều kiện thắng
```javascript
// Trong game.js
const WIN_CONDITION = 5; // Đổi thành 3, 4, 6, etc.
```

### Thay đổi màu sắc
```css
/* Trong style.css */
.cell.x {
    color: #667eea; /* Màu cho X */
}

.cell.o {
    color: #764ba2; /* Màu cho O */
}
```

## 📱 Browser Support

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari (Desktop & iOS)
- ✅ Samsung Internet
- ✅ Chrome Mobile

## 🚀 Hướng dẫn cài đặt

Không cần cài đặt gì cả! Chỉ cần:

1. Clone repository này
2. Mở file `index.html` trong trình duyệt
3. Bắt đầu chơi!

```bash
# Clone repo
git clone <repo-url>

# Mở trong browser
cd caro
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

## 🎓 Kỹ thuật sử dụng

- **CSS Grid**: Layout cho 100x100 cells
- **CSS Transform**: Zoom và pan không lag
- **Touch Events**: Pinch to zoom, pan gestures
- **Event Delegation**: Efficient event handling
- **LocalStorage**: Persistent score tracking
- **Responsive Design**: Mobile-first approach

## 📝 License

Free to use and modify.

## 🤝 Contributing

Feel free to fork and improve! Some ideas:
- AI opponent
- Online multiplayer
- Different board sizes selector
- Undo/Redo moves
- Game history/replay
- Custom themes

---

Made with ❤️ for Cờ Cá Rô lovers
