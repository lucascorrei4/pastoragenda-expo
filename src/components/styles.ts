import { StyleSheet } from 'react-native';
import { env } from '../env';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: env.BACKGROUND_COLOR,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: env.BACKGROUND_COLOR,
    padding: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: env.BACKGROUND_COLOR,
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: env.BACKGROUND_COLOR,
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: env.ERROR_COLOR,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: env.TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryText: {
    fontSize: 14,
    color: env.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: env.TEXT_COLOR,
    textAlign: 'center',
  },
  button: {
    backgroundColor: env.PRIMARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: env.BACKGROUND_COLOR,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: env.PRIMARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  secondaryButtonText: {
    color: env.PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: env.CARD_BACKGROUND,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: env.TEXT_COLOR,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: env.TEXT_COLOR,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: env.TEXT_COLOR,
    lineHeight: 24,
  },
  secondaryText: {
    fontSize: 14,
    color: env.TEXT_SECONDARY,
    lineHeight: 20,
  },
  successText: {
    fontSize: 16,
    color: env.SUCCESS_COLOR,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: env.ERROR_COLOR,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    color: env.WARNING_COLOR,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: env.BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: env.TEXT_COLOR,
    backgroundColor: env.BACKGROUND_COLOR,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexColumn: {
    flexDirection: 'column',
  },
  flex1: {
    flex: 1,
  },
  marginTop: {
    marginTop: 16,
  },
  marginBottom: {
    marginBottom: 16,
  },
  marginHorizontal: {
    marginHorizontal: 16,
  },
  marginVertical: {
    marginVertical: 16,
  },
  padding: {
    padding: 16,
  },
  paddingHorizontal: {
    paddingHorizontal: 16,
  },
  paddingVertical: {
    paddingVertical: 16,
  },
  textCenter: {
    textAlign: 'center',
  },
  textLeft: {
    textAlign: 'left',
  },
  textRight: {
    textAlign: 'right',
  },
  absolute: {
    position: 'absolute',
  },
  relative: {
    position: 'relative',
  },
  hidden: {
    display: 'none',
  },
  visible: {
    display: 'flex',
  },
});

export const webViewStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: env.BACKGROUND_COLOR,
  },
  webView: {
    flex: 1,
  },
  webViewHidden: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: env.BACKGROUND_COLOR,
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: env.TEXT_COLOR,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: env.BACKGROUND_COLOR,
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: env.ERROR_COLOR,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: env.TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryText: {
    fontSize: 14,
    color: env.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 8,
  },
});