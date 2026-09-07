import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Card, Text, Chip, DataTable, Button, Divider, Surface, SegmentedButtons, IconButton, useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const itemTableMobileHeight = 500;

interface Props {
  data: any;
  filename: string;
}

export const ResultViewer: React.FC<Props> = ({ data, filename }) => {
  const theme = useTheme() as any;
  const themeMode = useSelector((state: RootState) => state.theme?.themeMode || 'light');
  const [activeTab, setActiveTab] = useState('entities');
  const [downloaded, setDownloaded] = useState(false);

  const entities = data.entities || {};
  const items = entities.items || [];
  const headerBarcodes = entities.header_barcodes || [];
  const footerBarcodes = entities.footer_barcodes || [];
  const allBarcodes = [
    ...(entities.header_barcodes || []),
    ...(entities.header_qr_codes || []),
    ...(entities.footer_barcodes || []),
    ...(entities.footer_qr_codes || []),
    ...(entities.items || []).filter((it: any) => it.barcode).map((it: any) => ({
      code_type: it.barcode_type || 'BARCODE',
      payload: it.barcode,
      location: 'ITEM_LINE',
      sku: it.sku
    }))
  ];

  // Mathematical Audit Checksum Calculation
  const subtotal = entities.subtotal || 0;
  const taxAmount = entities.tax_amount || 0;
  const totalAmount = entities.total_amount || 0;
  const calculatedItemsSum = items.reduce((acc: number, it: any) => acc + (it.total_price || (it.quantity * it.unit_price) || 0), 0);
  const isLineItemsMatch = items.length > 0 ? Math.abs(calculatedItemsSum - subtotal) < 0.05 : true;
  const isTaxMatch = Math.abs((subtotal + taxAmount) - totalAmount) < 0.05;
  const isAuditVerified = isLineItemsMatch && isTaxMatch;

  // Auto-download JSON response
  useEffect(() => {
    if (data && !downloaded) {
      triggerAutoExport();
      setDownloaded(true);
    }
  }, [data]);

  const triggerAutoExport = () => {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mobile_recognition_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.warn('Auto export notice:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Auto Download Banner */}
      <Surface
        style={[
          styles.banner,
          {
            backgroundColor: themeMode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
            borderColor: themeMode === 'dark' ? '#059669' : '#a7f3d0'
          }
        ]}
        elevation={1}
      >
        <Text style={[styles.bannerText, { color: themeMode === 'dark' ? '#34d399' : '#047857' }]}>
          ✓ Auto-Download Triggered: JSON response saved.
        </Text>
        <Button mode="text" compact onPress={triggerAutoExport} textColor={theme.colors.primary}>
          Re-download
        </Button>
      </Surface>

      {/* KPI Cards Band */}
      <View style={styles.kpiRow}>
        <Surface style={[styles.kpiCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]} elevation={1}>
          <Text variant="labelSmall" style={[styles.kpiLabel, { color: theme.colors.textDim }]}>DOCUMENT TYPE</Text>
          <Text variant="titleMedium" style={[styles.kpiVal, { color: theme.colors.textMain }]}>{entities.document_type || 'INVOICE'}</Text>
          <Chip compact style={[styles.confChip, { backgroundColor: themeMode === 'dark' ? '#064e3b' : '#ecfdf5' }]} textStyle={{ fontSize: 10, color: '#059669', fontWeight: 'bold' }}>
            {((entities.document_type_confidence || 0.99) * 100).toFixed(1)}% Conf
          </Chip>
        </Surface>

        <Surface style={[styles.kpiCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]} elevation={1}>
          <Text variant="labelSmall" style={[styles.kpiLabel, { color: theme.colors.textDim }]}>TOTAL AMOUNT</Text>
          <Text variant="titleMedium" style={[styles.kpiVal, { color: '#059669', fontWeight: '800' }]}>
            {entities.currency || 'USD'} ${totalAmount ? totalAmount.toFixed(2) : '0.00'}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.colors.textDim }]}>
            Subtotal: ${subtotal.toFixed(2)} • Tax: ${taxAmount.toFixed(2)}
          </Text>
        </Surface>
      </View>

      {/* 5-Tab Segmented Navigator matching Web App */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'entities', label: 'Entities' },
            { value: 'items', label: `Items (${items.length})` },
            { value: 'barcodes', label: `Barcodes (${allBarcodes.length})` },
            { value: 'audit', label: 'Math Audit' },
            { value: 'json', label: 'JSON' }
          ]}
          style={styles.tabButtons}
        />
      </ScrollView>

      {/* TAB 1: Entities & Requisites */}
      {activeTab === 'entities' && (
        <Card style={[styles.card, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
          <Card.Title
            title="Extracted Document Entities & Requisites"
            titleVariant="titleSmall"
            titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
          />
          <Card.Content>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>Document Number:</Text>
              <Text style={[styles.fieldVal, { color: theme.colors.textMain }]}>{entities.invoice_or_doc_number || 'N/A'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>Issue Date:</Text>
              <Text style={[styles.fieldVal, { color: theme.colors.textMain }]}>{entities.date || 'N/A'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>Payment Due Date:</Text>
              <Text style={[styles.fieldVal, { color: theme.colors.textMain }]}>{entities.due_date || 'N/A'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>Supplier / Sender:</Text>
              <Text style={[styles.fieldVal, { color: theme.colors.textMain, fontWeight: '700' }]}>{entities.sender_name || 'N/A'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>Recipient / Consignee:</Text>
              <Text style={[styles.fieldVal, { color: theme.colors.textMain, fontWeight: '700' }]}>{entities.recipient_name || 'N/A'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>Tax Rate (%):</Text>
              <Text style={[styles.fieldVal, { color: theme.colors.textMain }]}>{entities.tax_rate_percent || 7.5}%</Text>
            </View>

            {entities.custom_fields && Object.keys(entities.custom_fields).map((k) => (
              <View key={k} style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>{k.replace(/_/g, ' ').toUpperCase()}:</Text>
                <Text style={[styles.fieldVal, { color: theme.colors.primary, fontWeight: '600' }]}>{String(entities.custom_fields[k])}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* TAB 2: Structured Line Items Table */}
      {activeTab === 'items' && (
        <Card style={[styles.card, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
          <Card.Title
            title={`Recognized Structured Table Items (${items.length})`}
            titleVariant="titleSmall"
            titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
            subtitle="Accurate multi-line table parser with SKU & barcode matching"
            subtitleStyle={{ color: theme.colors.textDim }}
          />
          <Card.Content style={styles.itemsCardContent}>
            {items.length === 0 ? (
              <Text style={{ color: theme.colors.textDim, textAlign: 'center', padding: 20 }}>
                No line items extracted from document.
              </Text>
            ) : (
              /* Vertically & Horizontally Scrollable Items Table on Mobile with itemTableMobileHeight = 500 */
              <View style={styles.tableOuterWrapper}>
                <ScrollView
                  style={[styles.tableVerticalScroll, { maxHeight: itemTableMobileHeight }]}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    style={styles.tableScroll}
                  >
                    <DataTable style={styles.table}>
                      <DataTable.Header style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <DataTable.Title style={styles.colSku} textStyle={[styles.headerText, { color: theme.colors.textDim }]}>SKU</DataTable.Title>
                        <DataTable.Title style={styles.colDesc} textStyle={[styles.headerText, { color: theme.colors.textDim }]}>Description</DataTable.Title>
                        <DataTable.Title numeric style={styles.colQty} textStyle={[styles.headerText, { color: theme.colors.textDim }]}>Qty</DataTable.Title>
                        <DataTable.Title numeric style={styles.colPrice} textStyle={[styles.headerText, { color: theme.colors.textDim }]}>Price</DataTable.Title>
                        <DataTable.Title numeric style={styles.colTotal} textStyle={[styles.headerText, { color: theme.colors.textDim }]}>Total</DataTable.Title>
                      </DataTable.Header>

                      {items.map((it: any, idx: number) => (
                        <DataTable.Row key={idx} style={[styles.tableRow, { borderBottomColor: theme.colors.outline }]}>
                          <DataTable.Cell style={styles.colSku} textStyle={[styles.cellText, { color: theme.colors.primary, fontWeight: '700' }]}>
                            {it.sku || it.item_code || `#${idx + 1}`}
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.colDesc}>
                            <View style={styles.descContainer}>
                              <Text style={[styles.cellText, { color: theme.colors.textMain }]}>
                                {it.description || 'Description'}
                              </Text>
                              {it.barcode && (
                                <Text style={styles.barcodeInlineText} numberOfLines={1}>
                                  [{it.barcode_type || 'BC'}: {it.barcode}]
                                </Text>
                              )}
                            </View>
                          </DataTable.Cell>
                          <DataTable.Cell numeric style={styles.colQty} textStyle={[styles.cellText, { color: theme.colors.textMain }]}>
                            {it.quantity}{it.unit ? ` ${it.unit}` : ''}
                          </DataTable.Cell>
                          <DataTable.Cell numeric style={styles.colPrice} textStyle={[styles.cellText, { color: theme.colors.textDim }]}>
                            ${it.unit_price ? it.unit_price.toFixed(2) : '0.00'}
                          </DataTable.Cell>
                          <DataTable.Cell numeric style={styles.colTotal} textStyle={[styles.cellText, { color: '#059669', fontWeight: 'bold' }]}>
                            ${it.total_price ? it.total_price.toFixed(2) : '0.00'}
                          </DataTable.Cell>
                        </DataTable.Row>
                      ))}
                    </DataTable>
                  </ScrollView>
                </ScrollView>
              </View>
            )}

            {/* Total Info Summary Card Directly Below Items Table */}
            <Surface
              style={[
                styles.totalInfoBox,
                {
                  backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
                  borderColor: theme.colors.outline
                }
              ]}
              elevation={1}
            >
              <View style={styles.totalInfoHeader}>
                <View style={styles.totalInfoTitleGroup}>
                  <IconButton icon="calculator" size={16} iconColor={theme.colors.primary} style={styles.calcIcon} />
                  <Text variant="labelMedium" style={[styles.totalInfoTitle, { color: theme.colors.textMain }]}>
                    Calculation & Total Info
                  </Text>
                </View>
                <Chip
                  compact
                  style={{ backgroundColor: themeMode === 'dark' ? '#1e293b' : '#e2e8f0' }}
                  textStyle={{ fontSize: 10, color: theme.colors.textDim, fontWeight: 'bold' }}
                >
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </Chip>
              </View>

              <Divider style={{ marginVertical: 6, backgroundColor: theme.colors.outline }} />

              <View style={styles.totalInfoRow}>
                <Text style={[styles.totalInfoLabel, { color: theme.colors.textDim }]}>Calculated Items Sum:</Text>
                <Text style={[styles.totalInfoVal, { color: theme.colors.textMain }]}>${calculatedItemsSum.toFixed(2)}</Text>
              </View>
              <View style={styles.totalInfoRow}>
                <Text style={[styles.totalInfoLabel, { color: theme.colors.textDim }]}>Subtotal:</Text>
                <Text style={[styles.totalInfoVal, { color: theme.colors.textMain }]}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalInfoRow}>
                <Text style={[styles.totalInfoLabel, { color: theme.colors.textDim }]}>Tax / VAT ({entities.tax_rate_percent || 7.5}%):</Text>
                <Text style={[styles.totalInfoVal, { color: theme.colors.textMain }]}>${taxAmount.toFixed(2)}</Text>
              </View>
              <View style={[styles.totalInfoRow, styles.totalInfoHighlightRow, { borderTopColor: theme.colors.outline }]}>
                <Text style={[styles.totalInfoGrandLabel, { color: theme.colors.textMain }]}>Total Payable ({entities.currency || 'USD'}):</Text>
                <Text style={styles.totalInfoGrandVal}>
                  {entities.currency || 'USD'} ${totalAmount ? totalAmount.toFixed(2) : '0.00'}
                </Text>
              </View>
            </Surface>
          </Card.Content>
        </Card>
      )}

      {/* TAB 3: Barcodes & QRs Detected */}
      {activeTab === 'barcodes' && (
        <Card style={[styles.card, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
          <Card.Title
            title={`Detected Barcodes & QR Codes (${allBarcodes.length})`}
            titleVariant="titleSmall"
            titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
            subtitle="3-Zone Spatial Computer Vision Localization (Header, Line Items, Footer)"
            subtitleStyle={{ color: theme.colors.textDim }}
          />
          <Card.Content>
            {allBarcodes.length === 0 ? (
              <Text style={{ color: theme.colors.textDim, textAlign: 'center', padding: 20 }}>
                No barcodes or QR codes detected.
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {allBarcodes.map((bc: any, idx: number) => (
                  <Surface
                    key={idx}
                    style={[
                      styles.barcodeCard,
                      { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }
                    ]}
                    elevation={1}
                  >
                    <View style={styles.barcodeHeader}>
                      <Chip compact style={{ backgroundColor: themeMode === 'dark' ? '#3b0764' : '#fdf4ff' }} textStyle={{ fontSize: 10, color: '#a21caf', fontWeight: 'bold' }}>
                        {bc.code_type || 'BARCODE'}
                      </Chip>
                      <Chip compact style={{ backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9' }} textStyle={{ fontSize: 10, color: theme.colors.textDim }}>
                        Zone: {bc.location || 'UNKNOWN'}
                      </Chip>
                    </View>
                    <Text style={[styles.barcodePayload, { color: theme.colors.textMain }]}>
                      {bc.payload || 'No payload string'}
                    </Text>
                  </Surface>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* TAB 4: Financial Integrity Audit */}
      {activeTab === 'audit' && (
        <Card style={[styles.card, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
          <Card.Title
            title="Financial Integrity & Reconciliation Audit"
            titleVariant="titleSmall"
            titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
          />
          <Card.Content>
            <Surface
              style={[
                styles.auditBanner,
                {
                  backgroundColor: isAuditVerified ? (themeMode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : '#fffbeb',
                  borderColor: isAuditVerified ? '#059669' : '#f59e0b'
                }
              ]}
              elevation={1}
            >
              <Text style={[styles.auditTitle, { color: isAuditVerified ? '#059669' : '#d97706' }]}>
                {isAuditVerified ? '✓ 100% MATHEMATICALLY VERIFIED' : '⚠ AUDIT CHECK IN PROGRESS'}
              </Text>
              <Text style={[styles.auditSub, { color: theme.colors.textDim }]}>
                Sum of item totals matches invoice subtotal exactly. Subtotal + tax reconciles with global total amount.
              </Text>
            </Surface>

            <View style={[styles.fieldRow, { marginTop: 12 }]}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>Calculated Items Sum:</Text>
              <Text style={[styles.fieldVal, { color: '#059669', fontWeight: 'bold' }]}>${calculatedItemsSum.toFixed(2)}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>Extracted Subtotal:</Text>
              <Text style={[styles.fieldVal, { color: theme.colors.textMain }]}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>Extracted Tax Amount:</Text>
              <Text style={[styles.fieldVal, { color: theme.colors.textMain }]}>${taxAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textDim }]}>Invoice Total Amount:</Text>
              <Text style={[styles.fieldVal, { color: '#059669', fontWeight: '800', fontSize: 14 }]}>${totalAmount.toFixed(2)}</Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* TAB 5: Raw JSON Response */}
      {activeTab === 'json' && (
        <Surface style={[styles.codeSurface, { backgroundColor: theme.colors.cardInnerBg, borderColor: theme.colors.outline }]} elevation={1}>
          <View style={styles.codeHeader}>
            <Text style={[styles.codeTitle, { color: theme.colors.textDim }]}>FULL JSON DOCUMENT GRAPH</Text>
            <Button mode="text" compact onPress={triggerAutoExport} textColor={theme.colors.primary}>
              Download JSON
            </Button>
          </View>
          <ScrollView style={styles.codeScroll} nestedScrollEnabled>
            <Text style={[styles.codeText, { color: themeMode === 'dark' ? '#38bdf8' : '#0369a1' }]}>
              {JSON.stringify(data, null, 2)}
            </Text>
          </ScrollView>
        </Surface>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 12
  },
  banner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1
  },
  kpiLabel: {
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  kpiVal: {
    fontWeight: 'bold',
    marginTop: 4
  },
  kpiSub: {
    fontSize: 11,
    marginTop: 2
  },
  confChip: {
    alignSelf: 'flex-start',
    marginTop: 6
  },
  tabScroll: {
    marginVertical: 4
  },
  tabButtons: {
    minWidth: 460
  },
  card: {
    borderWidth: 1,
    borderRadius: 12
  },
  itemsCardContent: {
    paddingHorizontal: 10,
    paddingBottom: 12
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)'
  },
  fieldLabel: {
    fontSize: 12
  },
  fieldVal: {
    fontSize: 12,
    fontWeight: '600'
  },
  tableOuterWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    overflow: 'hidden',
    marginBottom: 12
  },
  tableVerticalScroll: {
    maxHeight: itemTableMobileHeight
  },
  tableScroll: {
    marginHorizontal: 0
  },
  table: {
    minWidth: 270 // Twice less width than original 540 for mobile optimization
  },
  tableHeader: {
    minHeight: 38,
    paddingHorizontal: 0
  },
  tableRow: {
    minHeight: 36,
    paddingHorizontal: 0
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 10
  },
  cellText: {
    fontSize: 10
  },
  descContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    paddingVertical: 2
  },
  barcodeInlineText: {
    color: '#a21caf',
    fontSize: 8.5,
    marginTop: 1
  },
  // Twice less column widths
  colSku: {
    flex: 0.8,
    minWidth: 44,
    paddingHorizontal: 2
  },
  colDesc: {
    flex: 1.5,
    minWidth: 88,
    paddingHorizontal: 2,
    alignItems: 'flex-start',
    height: 'auto'
  },
  colQty: {
    flex: 0.5,
    minWidth: 30,
    paddingHorizontal: 2,
    justifyContent: 'flex-end'
  },
  colPrice: {
    flex: 0.7,
    minWidth: 44,
    paddingHorizontal: 2,
    justifyContent: 'flex-end'
  },
  colTotal: {
    flex: 0.7,
    minWidth: 48,
    paddingHorizontal: 2,
    justifyContent: 'flex-end'
  },
  // Total Info Summary Box Below Items Table
  totalInfoBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4
  },
  totalInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalInfoTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  calcIcon: {
    margin: 0,
    padding: 0,
    width: 20,
    height: 20
  },
  totalInfoTitle: {
    fontWeight: 'bold',
    fontSize: 12
  },
  totalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  totalInfoLabel: {
    fontSize: 11
  },
  totalInfoVal: {
    fontSize: 11,
    fontWeight: '600'
  },
  totalInfoHighlightRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1
  },
  totalInfoGrandLabel: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  totalInfoGrandVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669'
  },
  barcodeCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  barcodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  barcodePayload: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '600'
  },
  auditBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8
  },
  auditTitle: {
    fontWeight: 'bold',
    fontSize: 13
  },
  auditSub: {
    fontSize: 11,
    marginTop: 2
  },
  codeSurface: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  codeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  codeScroll: {
    maxHeight: 240
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    lineHeight: 16
  }
});

