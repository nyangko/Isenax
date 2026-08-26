// Utility functions for handling diagram data

export interface DiagramData {
  title: string;
  version?: string;
  description?: string;
  icons: any[];
  colors: any[];
  items: any[];
  views: any[];
  fitToScreen?: boolean;
}
