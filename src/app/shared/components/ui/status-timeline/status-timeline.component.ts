import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

// Định nghĩa một interface rõ ràng cho các trạng thái đã được tính toán
interface TimelineStatus {
  key: string;
  label: string;
  color?: string; // Giữ lại các thuộc tính gốc

  // Các thuộc tính được tính toán
  isActive: boolean;
  isCurrent: boolean;
  isPast: boolean;
  isClickable: boolean;
}

@Component({
  selector: 'app-status-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-timeline.component.html',
})
export class StatusTimelineComponent implements OnChanges {
  // --- Inputs & Outputs ---
  @Input() statuses: any[] = [];
  @Input() currentStatus: string = '';

  // Khi người dùng click, nó sẽ phát ra 'key' của trạng thái mới
  @Output() statusClick = new EventEmitter<string>();

  // --- State nội bộ ---
  public timelineStatuses: TimelineStatus[] = [];
  public currentIndex: number = 0;

  // Thuộc tính cho đường line động
  public activeLineWidth: string = '0%';
  public activeLineGradient: string = 'transparent';

  /**
   * Tự động tính toán lại khi @Input thay đổi
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['statuses'] || changes['currentStatus']) {
      this.updateTimeline();
    }
  }

  /**
   * Tính toán lại tất cả các trạng thái
   */
  private updateTimeline() {
    this.currentIndex = this.statuses.findIndex((s) => s.key === this.currentStatus);
    if (this.currentIndex === -1) this.currentIndex = 0; // Dự phòng

    // Tính toán style cho đường line
    const totalSteps = this.statuses.length - 1;
    if (this.currentIndex === 0 || totalSteps === 0) {
      this.activeLineWidth = '0%';
      this.activeLineGradient = 'transparent';
    } else {
      // (currentIndex / totalSteps) * 90%
      // (90% vì đường line có margin 5% ở mỗi bên)
      this.activeLineWidth = `${(this.currentIndex / totalSteps) * 90}%`;
      this.activeLineGradient = 'linear-gradient(to right, #3b82f6, #8b5cf6)';
    }

    // Tính toán trạng thái cho từng mốc (dot)
    this.timelineStatuses = this.statuses.map((status, index) => {
      const isPast = index < this.currentIndex;
      const isCurrent = index === this.currentIndex;
      const isActive = index <= this.currentIndex;
      const isClickable =
        index > this.currentIndex &&
        this.currentStatus !== 'completed' &&
        this.currentStatus !== 'canceled';

      return {
        ...status, // Giữ thuộc tính gốc (key, label)
        isActive,
        isCurrent,
        isPast,
        isClickable,
      };
    });
  }

  /**
   * Xử lý click và phát sự kiện
   */
  onStatusClick(status: TimelineStatus) {
    if (status.isClickable) {
      this.statusClick.emit(status.key);
    }
  }

  /**
   * Tối ưu *ngFor
   */
  trackByStatusKey(index: number, status: TimelineStatus): string {
    return status.key;
  }
}
