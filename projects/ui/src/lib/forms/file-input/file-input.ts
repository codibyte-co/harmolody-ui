import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon';
import { twMerge } from 'tailwind-merge';

export interface FileInfo {
  file: File;
  name: string;
  size: number;
  type: string;
}

@Component({
  selector: 'hui-file-input',
  template: `
    <div class="space-y-3">
      <!-- Drop Zone -->
      @if (enableDragDrop()) {
        <div
          class="relative"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          <div [class]="dropZoneClasses()">
            <div class="flex flex-col items-center justify-center py-6 text-center">
              <hui-icon name="cloud-upload" [size]="40" class="text-muted-foreground mb-2" />
              <p class=" text-text-muted mb-1">
                <span class="font-medium text-purple-600">Click to upload</span>
                or drag and drop
              </p>
              @if (accept()) {
                <p class="text-sm text-muted-foreground">{{ acceptDescription() }}</p>
              }
              @if (maxSize()) {
                <p class="text-sm text-muted-foreground">
                  Max file size: {{ formatBytes(maxSize()!) }}
                </p>
              }
            </div>
            <input
              [id]="id()"
              type="file"
              [accept]="accept()"
              [multiple]="multiple()"
              [disabled]="isDisabled()"
              (change)="onFileSelect($event)"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              [attr.aria-label]="ariaLabel() || 'File upload'"
              [attr.aria-describedby]="ariaDescribedby()"
              [attr.aria-invalid]="isInvalid() || null"
            />
          </div>
        </div>
      } @else {
        <!-- Simple File Input Button -->
        <div class="flex items-center gap-3">
          <label [class]="buttonClasses()">
            <hui-icon name="upload" [size]="18" class="mr-2" />
            {{ placeholder() || 'Choose files' }}
            <input
              [id]="id()"
              type="file"
              [accept]="accept()"
              [multiple]="multiple()"
              [disabled]="isDisabled()"
              (change)="onFileSelect($event)"
              class="sr-only"
              [attr.aria-label]="ariaLabel() || 'File upload'"
              [attr.aria-describedby]="ariaDescribedby()"
              [attr.aria-invalid]="isInvalid() || null"
            />
          </label>
          @if (files().length === 0) {
            <span class=" text-muted-foreground">No files selected</span>
          }
        </div>
      }

      <!-- File List -->
      @if (files().length > 0) {
        <ul class="space-y-2" role="list" [attr.aria-label]="'Selected files'">
          @for (fileInfo of files(); track fileInfo.name + fileInfo.size) {
            <li
              class="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <hui-icon
                  [name]="getFileIcon(fileInfo.type)"
                  [size]="24"
                  class="text-muted-foreground shrink-0"
                />
                <div class="min-w-0 flex-1">
                  <p class=" font-medium text-text-secondary truncate">{{ fileInfo.name }}</p>
                  <p class="text-sm text-muted-foreground">{{ formatBytes(fileInfo.size) }}</p>
                </div>
              </div>
              <button
                type="button"
                (click)="removeFile(fileInfo)"
                [disabled]="isDisabled()"
                class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-surface text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                [attr.aria-label]="'Remove ' + fileInfo.name"
                [attr.title]="'Remove ' + fileInfo.name"
              >
                <hui-icon name="trash" [size]="18" />
              </button>
            </li>
          }
        </ul>
      }

      <!-- Validation Messages -->
      @if (validationError()) {
        <p class=" text-red-600 flex items-center gap-1">
          <hui-icon name="exclamation-circle" [size]="16" />
          {{ validationError() }}
        </p>
      }
    </div>
  `,
  host: {
    '[class]': '"block w-full"',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
})
export class FileInputComponent implements ControlValueAccessor {
  id = input<string>('');
  placeholder = input<string>('');
  ariaLabel = input<string>('');
  ariaDescribedby = input<string>('');
  invalid = input<boolean>(false);

  accept = input<string>('');
  multiple = input<boolean>(false);
  maxSize = input<number | undefined>(undefined);
  maxFiles = input<number | undefined>(undefined);
  enableDragDrop = input<boolean>(true);

  protected readonly files = signal<FileInfo[]>([]);
  protected readonly isDisabled = signal<boolean>(false);
  protected readonly isDragOver = signal<boolean>(false);
  protected readonly validationError = signal<string>('');
  protected readonly isInvalid = computed(() => this.invalid() || !!this.validationError());

  protected readonly acceptDescription = computed(() => {
    const acceptValue = this.accept();
    if (!acceptValue) return '';

    const types = acceptValue.split(',').map((t) => t.trim());
    const descriptions: string[] = [];

    for (const type of types) {
      if (type.startsWith('.')) {
        descriptions.push(type.toUpperCase().slice(1));
      } else if (type.includes('/')) {
        const [category, subtype] = type.split('/');
        if (subtype === '*') {
          descriptions.push(category.charAt(0).toUpperCase() + category.slice(1) + ' files');
        } else {
          descriptions.push(subtype.toUpperCase());
        }
      }
    }

    return descriptions.join(', ');
  });

  protected readonly dropZoneClasses = computed(() => {
    const baseClasses = 'border-2 border-dashed rounded-lg transition-colors';
    const dragOverClasses = 'border-purple-500 bg-purple-50';
    const normalClasses = 'border-border hover:border-gray-400';
    const errorClasses = 'border-red-300 bg-red-50';
    const disabledClasses = this.isDisabled() ? 'opacity-50 cursor-not-allowed' : '';

    return twMerge(
      baseClasses,
      this.isInvalid() ? errorClasses : this.isDragOver() ? dragOverClasses : normalClasses,
      disabledClasses,
    );
  });

  protected readonly buttonClasses = computed(() => {
    const baseClasses =
      'inline-flex items-center px-4 py-2 border rounded-md shadow-sm  font-medium cursor-pointer transition-colors focus-within:outline-none';
    const normalClasses =
      'border-border bg-surface text-text-secondary hover:bg-surface-hover focus-within:border-purple-500';
    const errorClasses =
      'border-red-300 bg-surface text-red-700 hover:bg-red-50 focus-within:border-red-500';
    const disabledClasses = this.isDisabled()
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : '';

    return twMerge(baseClasses, this.isInvalid() ? errorClasses : normalClasses, disabledClasses);
  });

  private onChange: (value: File[]) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isDisabled()) {
      this.isDragOver.set(true);
    }
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.isDisabled()) return;

    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  protected removeFile(fileInfo: FileInfo): void {
    const currentFiles = this.files();
    const updatedFiles = currentFiles.filter(
      (f) => !(f.name === fileInfo.name && f.size === fileInfo.size),
    );
    this.files.set(updatedFiles);
    this.emitChange(updatedFiles);
    this.validationError.set('');
  }

  protected formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  protected getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'music';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document-text';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table-cells';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive-box';
    return 'document';
  }

  private addFiles(newFiles: File[]): void {
    this.validationError.set('');
    this.onTouched();

    const maxSizeValue = this.maxSize();
    const maxFilesValue = this.maxFiles();
    const acceptValue = this.accept();
    const isMultiple = this.multiple();

    const validFiles: FileInfo[] = [];

    for (const file of newFiles) {
      if (acceptValue && !this.isFileTypeValid(file, acceptValue)) {
        this.validationError.set(`Invalid file type: ${file.name}`);
        continue;
      }

      if (maxSizeValue && file.size > maxSizeValue) {
        this.validationError.set(
          `File "${file.name}" exceeds maximum size of ${this.formatBytes(maxSizeValue)}`,
        );
        continue;
      }

      validFiles.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    if (validFiles.length === 0) return;

    let updatedFiles: FileInfo[];

    if (isMultiple) {
      const currentFiles = this.files();
      updatedFiles = [...currentFiles, ...validFiles];

      if (maxFilesValue && updatedFiles.length > maxFilesValue) {
        this.validationError.set(`Maximum ${maxFilesValue} files allowed`);
        updatedFiles = updatedFiles.slice(0, maxFilesValue);
      }
    } else {
      updatedFiles = [validFiles[0]];
    }

    this.files.set(updatedFiles);
    this.emitChange(updatedFiles);
  }

  private isFileTypeValid(file: File, accept: string): boolean {
    const acceptTypes = accept.split(',').map((t) => t.trim().toLowerCase());
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    return acceptTypes.some((type) => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      if (type.endsWith('/*')) {
        const category = type.slice(0, -2);
        return fileType.startsWith(category + '/');
      }
      return fileType === type;
    });
  }

  private emitChange(fileInfos: FileInfo[]): void {
    const files = fileInfos.map((f) => f.file);
    this.onChange(files);
  }

  writeValue(value: File[] | null): void {
    if (!value || value.length === 0) {
      this.files.set([]);
      return;
    }

    const fileInfos: FileInfo[] = value.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    this.files.set(fileInfos);
  }

  registerOnChange(fn: (value: File[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
