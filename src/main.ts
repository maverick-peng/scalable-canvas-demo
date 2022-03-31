import './style.css'
import imgUrl from './assets/2F-閱覽座位.png'

/**
 * Extend CanvasRenderingContext2D class so that it could draw rectangle with rounded corners
 */ 
 CanvasRenderingContext2D.prototype.roundRect = function(x: number, y: number, w: number, h: number, r: number) {
  this.strokeStyle = "#555";

  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
}

const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
const context = canvas?.getContext('2d')!;


class Button {
  constructor(public x: number, public y: number, public w: number, public h: number, public r?: number, public style?: string) {}
}

// Frame api to manipulate canvas behavior
class Frame {
  private ctx: CanvasRenderingContext2D;
  private scale = 1;
  private originx = 0;
  private originy = 0;
  private visibleWidth;
  private visibleHeight;
  private zoomIntensity = 0.2;
  private image: HTMLImageElement;

  static wheelCallback: ((e: WheelEvent) => void) | null;
  static animationId: number | null = null;

  constructor(
    public canvas: HTMLCanvasElement,
    public width: number,
    public height: number,
    public maxScale: number,
    public minScale: number,
    public buttons: Array<Button>,
    public imageUrl: string 
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = width;
    this.canvas.height = height;
    this.visibleWidth = width;
    this.visibleHeight = height;

    // Make sure that event callback is singleton
    if (Frame.wheelCallback) {
      canvas.removeEventListener('wheel', Frame.wheelCallback);
    }

    if (Frame.animationId) {
      window.cancelAnimationFrame(Frame.animationId);
    }

    this.image = new Image();
    this.image.classList.add('auto');
    this.image.src = this.imageUrl;
    
    this.image.onload = () => {

      this.ctx.drawImage(this.image, 0, 0, 1920, 2000, 0, 0, 1920, 2000);
      this.render();
    }
  }


  render() {
    // Clear context
    this.ctx.clearRect(this.originx, this.originy, this.visibleWidth, this.visibleHeight);

    // Set background
    this.ctx.fillStyle = '#fff';  // TODO: Background
    this.ctx.fillRect(this.originx, this.originy, this.visibleWidth, this.visibleHeight);

    this.ctx.drawImage(this.image, 0, 0, 1920, 2000, 0, 0, 1920, 2000);
    

    // Render all buttons
    this.buttons.forEach(btn => this.renderButton(btn));

    Frame.animationId = window.requestAnimationFrame(this.render.bind(this));
  }

  reset() {
    this.ctx.clearRect(this.originx, this.originy, this.width, this.height);

    // reset everything
    context.resetTransform();
    this.visibleWidth = this.width;
    this.visibleHeight = this.height;
    this.originx = 0;
    this.originy = 0;
    this.scale = 1;

    this.render();
  }

  renderButton(button: Button) {
    context.beginPath();
    context.fillStyle = button.style || '#aaa';
    context.roundRect(button.x, button.y, button.w, button.h, button.r ?? 0);
    context.fill();
    context.closePath();
  }

  listenWheel() {
    const self = this;
    Frame.wheelCallback = (event: WheelEvent) => {
      event.preventDefault();
      // Get mouse offset.
      const mousex = event.clientX - canvas.offsetLeft;
      const mousey = event.clientY - canvas.offsetTop;
      // Normalize mouse wheel movement to +1 or -1 to avoid unusual jumps.
      const wheel = event.deltaY < 0 ? 1 : -1;
    
      // Stop zomming if reaching boundaries.
      if (( wheel === -1 && self.scale < self.minScale ) || ( wheel === 1 && self.scale > self.maxScale)) {
        return;
      } 
    
      // Compute zoom factor.
      const zoom = Math.exp(wheel * self.zoomIntensity);
      
      // Translate so the visible origin is at the context's origin.
      self.ctx.translate(self.originx, self.originy);
    
      // Compute the new visible origin.
      self.originx -= mousex / (self.scale * zoom) - mousex / self.scale;
      self.originy -= mousey / (self.scale * zoom) - mousey / self.scale;
      
      // Scale it (centered around the origin due to the trasnslate above).
      self.ctx.scale(zoom, zoom);
      // Offset the visible origin to it's proper position.
      self.ctx.translate(-self.originx, -self.originy);
    
      // Update scale and others.
      self.scale *= zoom;
      self.visibleWidth = self.width / self.scale;
      self.visibleHeight = self.height / self.scale;
    }
    this.canvas.addEventListener('wheel', Frame.wheelCallback)
  }
}

const btns = new Array<Button>();
// for (let i = 0; i < 20; i++) {
//   btns.push(new Button(50 + i * 70, 100, 50, 50, 10));
// }
btns.push(new Button(89, 234, 58, 58, 8, '#ab8'));
btns.push(new Button(149, 234, 61, 58, 8, '#ab0'));
btns.push(new Button(213, 234, 57, 58, 8, '#abf'));


let frame = new Frame(canvas, 500, 500, 2.0, 0.5, btns, imgUrl);
frame.listenWheel();

// Reset Button
const resetBtn = document.getElementById('resetBtn');
resetBtn?.addEventListener('click', () => {
  frame.reset();
})

// Resize window
window.addEventListener('resize', () => {
  frame = new Frame(canvas, window.innerWidth * .7, 500, 2, 0.5, btns, imgUrl);
  frame.listenWheel();
})
